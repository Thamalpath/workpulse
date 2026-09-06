import { query, withTransaction } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type RoleRow = {
  id: string | number;
  key: string;
  name: string;
  description: string | null;
};

type PermissionRow = {
  id: string | number;
  name: string;
  module: string;
  description: string | null;
};

function mapRole(
  role: RoleRow,
  permissions: PermissionRow[],
  userCount: number,
) {
  return {
    id: String(role.id),
    key: role.key,
    name: role.name,
    description: role.description,
    permissions: permissions.map((p) => ({
      id: String(p.id),
      name: p.name,
      module: p.module,
      description: p.description,
    })),
    userCount,
  };
}

async function getRolePermissions(
  roleId: string | number,
): Promise<PermissionRow[]> {
  return (await query(
    `SELECT p.id, p.\`key\`, p.name, p.module, p.description
     FROM Permission p
     JOIN RolePermission rp ON rp.permissionId = p.id
     WHERE rp.roleId = ?
     ORDER BY p.name ASC`,
    [roleId],
  )) as PermissionRow[];
}

async function getRoleUserCount(roleId: string | number): Promise<number> {
  const rows = (await query(
    `SELECT COUNT(*) AS count FROM UserRole WHERE roleId = ?`,
    [roleId],
  )) as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

export async function listRoles(options: { hideRoleKeys?: string[] } = {}) {
  const roles = (await query(
    `SELECT id, \`key\`, name, description FROM Role ORDER BY createdAt ASC`,
  )) as RoleRow[];

  const visible = options.hideRoleKeys?.length
    ? roles.filter((role) => !(options.hideRoleKeys as string[]).includes(role.key))
    : roles;

  const result = [];
  for (const role of visible) {
    const [permissions, userCount] = await Promise.all([
      getRolePermissions(role.id),
      getRoleUserCount(role.id),
    ]);
    result.push(mapRole(role, permissions, userCount));
  }
  return result;
}

export async function getRoleById(id: string) {
  const rows = (await query(
    `SELECT id, \`key\`, name, description FROM Role WHERE id = ? LIMIT 1`,
    [id],
  )) as RoleRow[];
  const role = rows[0];
  if (!role) {
    throw new ApiError(404, "Role not found.");
  }
  const [permissions, userCount] = await Promise.all([
    getRolePermissions(role.id),
    getRoleUserCount(role.id),
  ]);
  return mapRole(role, permissions, userCount);
}

export async function createRole(data: {
  name: string;
  key: string;
  description?: string;
  permissionIds: string[];
}) {
  const existing = (await query(
    `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
    [data.key],
  )) as { id: string | number }[];
  if (existing.length > 0) {
    throw new ApiError(409, "A role with this key already exists.");
  }

  const id = String(
    await withTransaction(async (exec) => {
      const insertId = await exec.insertId(
        `INSERT INTO Role (name, \`key\`, description) VALUES (?, ?, ?)`,
        [data.name, data.key, data.description ?? null],
      );

      for (const permissionId of data.permissionIds) {
        await exec.run(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [insertId, permissionId],
        );
      }

      return insertId;
    }),
  );

  const permissions = await getRolePermissions(id);
  return mapRole(
    {
      id,
      key: data.key,
      name: data.name,
      description: data.description ?? null,
    },
    permissions,
    0,
  );
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] },
) {
  const existing = (await query(
    `SELECT id, \`key\`, name, description FROM Role WHERE id = ? LIMIT 1`,
    [id],
  )) as RoleRow[];
  const role = existing[0];
  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  const newName = data.name ?? role.name;
  const newDescription =
    data.description !== undefined ? data.description : role.description;

  if (role.key === "admin" && data.permissionIds !== undefined) {
    throw new ApiError(
      400,
      "The Admin role always has all permissions and they cannot be changed.",
    );
  }

  await query(
    `UPDATE Role SET name = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
    [newName, newDescription, id],
  );

  if (data.permissionIds !== undefined) {
    const permissionIds = data.permissionIds;
    await withTransaction(async (exec) => {
      await exec.run(`DELETE FROM RolePermission WHERE roleId = ?`, [id]);
      for (const permissionId of permissionIds) {
        await exec.run(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [id, permissionId],
        );
      }
    });
  }

  const permissions = await getRolePermissions(id);
  const userCount = await getRoleUserCount(id);
  return mapRole(
    { ...role, name: newName, description: newDescription },
    permissions,
    userCount,
  );
}

export async function deleteRole(id: string) {
  const rows = (await query(`SELECT id FROM Role WHERE id = ? LIMIT 1`, [
    id,
  ])) as { id: string }[];
  const existing = rows[0];
  if (!existing) {
    throw new ApiError(404, "Role not found.");
  }
  const userCount = await getRoleUserCount(id);
  if (userCount > 0) {
    throw new ApiError(400, "Role is assigned to users and cannot be deleted.");
  }
  await query(`DELETE FROM Role WHERE id = ?`, [id]);
}
