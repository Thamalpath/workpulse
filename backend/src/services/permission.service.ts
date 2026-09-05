import { insert, query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type PermissionRow = {
  id: string | number;
  key: string;
  name: string;
  module: string;
  description: string | null;
};

function mapPermission(row: PermissionRow, isAdminLocked = false) {
  return {
    id: String(row.id),
    key: row.key,
    name: row.name,
    module: row.module,
    description: row.description,
    isAdminLocked,
  };
}

async function getAdminRoleId(): Promise<string | number | null> {
  const rows = (await query(
    `SELECT id FROM Role WHERE \`key\` = 'admin' LIMIT 1`
  )) as { id: string | number }[];
  return rows[0]?.id ?? null;
}

async function getAdminLockedPermissionIds(): Promise<Set<string>> {
  const rows = (await query(
    `SELECT rp.permissionId
     FROM RolePermission rp
     JOIN Role r ON r.id = rp.roleId
     WHERE r.\`key\` = 'admin'`
  )) as { permissionId: string | number }[];
  return new Set(rows.map((row) => String(row.permissionId)));
}

export async function listPermissions() {
  const permissions = (await query(
    `SELECT id, \`key\`, name, module, description
     FROM Permission
     ORDER BY module ASC, name ASC`
  )) as PermissionRow[];

  const adminLockedIds = await getAdminLockedPermissionIds();
  return permissions.map((p) =>
    mapPermission(p, adminLockedIds.has(String(p.id)))
  );
}

export async function getPermissionById(id: string) {
  const rows = (await query(
    `SELECT id, \`key\`, name, module, description
     FROM Permission WHERE id = ? LIMIT 1`,
    [id]
  )) as PermissionRow[];
  const permission = rows[0];
  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }
  const adminLockedIds = await getAdminLockedPermissionIds();
  return mapPermission(permission, adminLockedIds.has(String(permission.id)));
}

export async function createPermission(data: {
  name: string;
  key: string;
  module: string;
  description?: string;
}) {
  const key = data.key.trim();
  const name = data.name.trim();
  const module = data.module.trim();
  const description = data.description?.trim() || null;

  const existing = (await query(
    `SELECT id FROM Permission WHERE \`key\` = ? LIMIT 1`,
    [key]
  )) as { id: string | number }[];
  if (existing.length > 0) {
    throw new ApiError(409, "A permission with this key already exists.");
  }

  const id = String(
    await insert(
      `INSERT INTO Permission (name, \`key\`, description, module) VALUES (?, ?, ?, ?)`,
      [name, key, description, module]
    )
  );

  // The Admin role must always hold every permission, including new ones.
  const adminRoleId = await getAdminRoleId();
  if (adminRoleId !== null) {
    await query(
      `INSERT IGNORE INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
      [adminRoleId, id]
    );
  }

  return mapPermission(
    { id, key, name, module, description },
    true
  );
}

export async function updatePermission(
  id: string,
  data: { name?: string; key?: string; module?: string; description?: string }
) {
  const rows = (await query(
    `SELECT id, \`key\`, name, module, description
     FROM Permission WHERE id = ? LIMIT 1`,
    [id]
  )) as PermissionRow[];
  const permission = rows[0];
  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }

  const newKey = data.key?.trim() ?? permission.key;
  const newName = data.name?.trim() ?? permission.name;
  const newModule = data.module?.trim() ?? permission.module;
  const newDescription =
    data.description !== undefined
      ? data.description.trim() || null
      : permission.description;

  if (newKey !== permission.key) {
    const dup = (await query(
      `SELECT id FROM Permission WHERE \`key\` = ? AND id != ? LIMIT 1`,
      [newKey, id]
    )) as { id: string | number }[];
    if (dup.length > 0) {
      throw new ApiError(409, "A permission with this key already exists.");
    }
  }

  await query(
    `UPDATE Permission SET name = ?, \`key\` = ?, module = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
    [newName, newKey, newModule, newDescription, id]
  );

  const adminLockedIds = await getAdminLockedPermissionIds();
  return mapPermission(
    { id, key: newKey, name: newName, module: newModule, description: newDescription },
    adminLockedIds.has(String(id))
  );
}

export async function deletePermission(id: string) {
  const rows = (await query(
    `SELECT id FROM Permission WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string | number }[];
  if (rows.length === 0) {
    throw new ApiError(404, "Permission not found.");
  }

  const adminCount = (await query(
    `SELECT COUNT(*) AS count
     FROM RolePermission rp
     JOIN Role r ON r.id = rp.roleId
     WHERE rp.permissionId = ? AND r.\`key\` = 'admin'`,
    [id]
  )) as { count: number }[];
  if (Number(adminCount[0]?.count ?? 0) > 0) {
    throw new ApiError(
      400,
      "This permission is assigned to the Admin role and cannot be deleted."
    );
  }

  await query(`DELETE FROM Permission WHERE id = ?`, [id]);
}