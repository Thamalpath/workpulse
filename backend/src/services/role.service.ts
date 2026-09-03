import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

type PermissionRow = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
};

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapRole(role: RoleRow, permissions: PermissionRow[], userCount: number) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: toBoolean(role.isSystem),
    permissions: permissions.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      module: p.module,
      description: p.description,
    })),
    userCount,
  };
}

async function getRolePermissions(roleId: string): Promise<PermissionRow[]> {
  return (await query(
    `SELECT p.id, p.key, p.name, p.module, p.description
     FROM Permission p
     JOIN RolePermission rp ON rp.permissionId = p.id
     WHERE rp.roleId = ?
     ORDER BY p.name ASC`,
    [roleId]
  )) as PermissionRow[];
}

async function getRoleUserCount(roleId: string): Promise<number> {
  const rows = (await query(
    `SELECT COUNT(*) AS count FROM UserRole WHERE roleId = ?`,
    [roleId]
  )) as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

export async function listRoles() {
  const roles = (await query(
    `SELECT id, key, name, description, isSystem FROM Role ORDER BY createdAt ASC`
  )) as RoleRow[];

  const result = [];
  for (const role of roles) {
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
    `SELECT id, key, name, description, isSystem FROM Role WHERE id = ? LIMIT 1`,
    [id]
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
    `SELECT id FROM Role WHERE key = ? LIMIT 1`,
    [data.key]
  )) as { id: string }[];
  if (existing.length > 0) {
    throw new ApiError(409, "A role with this key already exists.");
  }

  const id = crypto.randomUUID();
  await query(
    `INSERT INTO Role (id, name, key, description, isSystem) VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.key, data.description ?? null, false]
  );

  for (const permissionId of data.permissionIds) {
    await query(
      `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
      [id, permissionId]
    );
  }

  const permissions = await getRolePermissions(id);
  return mapRole(
    { id, key: data.key, name: data.name, description: data.description ?? null, isSystem: false },
    permissions,
    0
  );
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] }
) {
  const existing = (await query(
    `SELECT id, key, name, description, isSystem FROM Role WHERE id = ? LIMIT 1`,
    [id]
  )) as RoleRow[];
  const role = existing[0];
  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  const newName = data.name ?? role.name;
  const newDescription = data.description !== undefined ? data.description : role.description;
  await query(`UPDATE Role SET name = ?, description = ?, updatedAt = NOW() WHERE id = ?`, [
    newName,
    newDescription,
    id,
  ]);

  if (data.permissionIds !== undefined) {
    await query(`DELETE FROM RolePermission WHERE roleId = ?`, [id]);
    for (const permissionId of data.permissionIds) {
      await query(`INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`, [
        id,
        permissionId,
      ]);
    }
  }

  const permissions = await getRolePermissions(id);
  const userCount = await getRoleUserCount(id);
  return mapRole(
    { ...role, name: newName, description: newDescription },
    permissions,
    userCount
  );
}

export async function deleteRole(id: string) {
  const rows = (await query(
    `SELECT id, isSystem FROM Role WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string; isSystem: boolean }[];
  const existing = rows[0];
  if (!existing) {
    throw new ApiError(404, "Role not found.");
  }
  if (toBoolean(existing.isSystem)) {
    throw new ApiError(400, "System roles cannot be deleted.");
  }
  const userCount = await getRoleUserCount(id);
  if (userCount > 0) {
    throw new ApiError(400, "Role is assigned to users and cannot be deleted.");
  }
  await query(`DELETE FROM Role WHERE id = ?`, [id]);
}

export async function listPermissions() {
  const permissions = (await query(
    `SELECT id, key, name, module, description FROM Permission ORDER BY module ASC, name ASC`
  )) as PermissionRow[];
  return permissions.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    module: p.module,
    description: p.description,
  }));
}
