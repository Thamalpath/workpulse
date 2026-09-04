import { query, withTransaction } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type UserRow = {
  id: string | number;
  email: string;
  username: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
};

type RoleShape = {
  id: string;
  key: string;
  name: string;
  permissions: string[];
};

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapUser(row: UserRow, roles: RoleShape[]) {
  return {
    id: String(row.id),
    email: row.email,
    username: row.username,
    name: row.name,
    isActive: toBoolean(row.isActive),
    createdAt: row.createdAt,
    roles,
  };
}

async function getRolesForUser(userId: string | number): Promise<RoleShape[]> {
  const roleRows = (await query(
    `SELECT r.id, r.\`key\`, r.name
     FROM Role r
     JOIN UserRole ur ON ur.roleId = r.id
     WHERE ur.userId = ?
     ORDER BY r.createdAt ASC`,
    [userId]
  )) as { id: string | number; key: string; name: string }[];

  const roles: RoleShape[] = [];
  for (const role of roleRows) {
    const permissionRows = (await query(
      `SELECT p.\`key\`
       FROM Permission p
       JOIN RolePermission rp ON rp.permissionId = p.id
       WHERE rp.roleId = ?`,
      [role.id]
    )) as { key: string }[];
    roles.push({
      id: String(role.id),
      key: role.key,
      name: role.name,
      permissions: permissionRows.map((p) => p.key),
    });
  }
  return roles;
}

async function fetchUserWithRoles(id: string) {
  const rows = (await query(
    `SELECT id, email, username, name, isActive, createdAt
     FROM User WHERE id = ? LIMIT 1`,
    [id]
  )) as UserRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }
  const roles = await getRolesForUser(row.id);
  return mapUser(row, roles);
}

export async function listUsers() {
  const rows = (await query(
    `SELECT id, email, username, name, isActive, createdAt
     FROM User ORDER BY createdAt DESC`
  )) as UserRow[];

  const result = [];
  for (const row of rows) {
    const roles = await getRolesForUser(row.id);
    result.push(mapUser(row, roles));
  }
  return result;
}

export async function getUserById(id: string) {
  const user = await fetchUserWithRoles(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return user;
}

export async function createUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  roleIds: string[];
}) {
  const email = data.email.toLowerCase();
  const username = data.username.toLowerCase();

  const existingRows = (await query(
    `SELECT id FROM User WHERE email = ? OR username = ? LIMIT 1`,
    [email, username]
  )) as { id: string }[];
  if (existingRows.length > 0) {
    throw new ApiError(409, "A user with this email or username already exists.");
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const id = String(
    await withTransaction(async (exec) => {
      const insertId = await exec.insertId(
        `INSERT INTO User (email, username, password, name, isActive)
         VALUES (?, ?, ?, ?, ?)`,
        [email, username, hashedPassword, data.name, true]
      );

      for (const roleId of data.roleIds) {
        await exec.run(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [insertId, roleId]);
      }

      return insertId;
    })
  );

  const roles = await getRolesForUser(id);
  return mapUser(
    {
      id,
      email,
      username,
      name: data.name,
      isActive: true,
      createdAt: new Date(),
    },
    roles
  );
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  }
) {
  const existing = (await query(`SELECT id FROM User WHERE id = ? LIMIT 1`, [id])) as {
    id: string | number;
  }[];
  if (existing.length === 0) {
    throw new ApiError(404, "User not found.");
  }

  if (data.name !== undefined) {
    await query(`UPDATE User SET name = ?, updatedAt = NOW() WHERE id = ?`, [data.name, id]);
  }
  if (data.isActive !== undefined) {
    await query(`UPDATE User SET isActive = ?, updatedAt = NOW() WHERE id = ?`, [
      data.isActive ? 1 : 0,
      id,
    ]);
  }
  if (data.password !== undefined && data.password !== "") {
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash(data.password, 10);
    await query(`UPDATE User SET password = ?, updatedAt = NOW() WHERE id = ?`, [hashed, id]);
  }
  if (data.roleIds !== undefined) {
    const roleIds = data.roleIds;
    await withTransaction(async (exec) => {
      await exec.run(`DELETE FROM UserRole WHERE userId = ?`, [id]);
      for (const roleId of roleIds) {
        await exec.run(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [id, roleId]);
      }
    });
  }

  const user = await fetchUserWithRoles(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return user;
}

export async function deleteUser(id: string) {
  const existing = (await query(`SELECT id FROM User WHERE id = ? LIMIT 1`, [id])) as {
    id: string | number;
  }[];
  if (existing.length === 0) {
    throw new ApiError(404, "User not found.");
  }
  await query(`DELETE FROM User WHERE id = ?`, [id]);
}
