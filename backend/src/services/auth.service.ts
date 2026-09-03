import bcrypt from "bcryptjs";

import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

const DEFAULT_ROLE_KEYS = ["team-member"];

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  position: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

export type AuthRole = {
  id: string;
  key: string;
  name: string;
  permissions: string[];
};

type UserWithRoles = AuthUser & {
  password: string;
  roles: {
    role: {
      id: string;
      key: string;
      name: string;
      permissions: { permission: { key: string } }[];
    };
  }[];
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  password: string;
  name: string;
  position: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

async function fetchUserWithRoles(userId: string): Promise<{ roles: UserWithRoles["roles"] }> {
  const roleRows = (await query(
    `SELECT r.id, r.key, r.name
     FROM Role r
     JOIN UserRole ur ON ur.roleId = r.id
     WHERE ur.userId = ?
     ORDER BY r.createdAt ASC`,
    [userId]
  )) as { id: string; key: string; name: string }[];

  const roles: UserWithRoles["roles"] = [];
  for (const role of roleRows) {
    const permissionRows = (await query(
      `SELECT p.key
       FROM Permission p
       JOIN RolePermission rp ON rp.permissionId = p.id
       WHERE rp.roleId = ?`,
      [role.id]
    )) as { key: string }[];
    roles.push({
      role: {
        id: role.id,
        key: role.key,
        name: role.name,
        permissions: permissionRows.map((p) => ({ permission: { key: p.key } })),
      },
    });
  }
  return { roles };
}

function toUserShape(row: UserRow, roles: UserWithRoles["roles"]): UserWithRoles {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    password: row.password,
    name: row.name,
    position: row.position,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    roles,
  };
}

export async function findByEmailOrUsername(identifier: string) {
  const rows = (await query(
    `SELECT * FROM User WHERE email = ? OR username = ? LIMIT 1`,
    [identifier, identifier]
  )) as UserRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }
  const { roles } = await fetchUserWithRoles(row.id);
  return toUserShape(row, roles);
}

export async function findById(id: string) {
  const rows = (await query(`SELECT * FROM User WHERE id = ? LIMIT 1`, [id])) as UserRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }
  const { roles } = await fetchUserWithRoles(row.id);
  return toUserShape(row, roles);
}

export async function registerUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  position?: string;
  roleKeys?: string[];
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

  const roleKeys = data.roleKeys && data.roleKeys.length > 0 ? data.roleKeys : DEFAULT_ROLE_KEYS;
  const placeholders = roleKeys.map(() => "?").join(",");
  const roleRows = (await query(
    `SELECT id, key, name FROM Role WHERE key IN (${placeholders})`,
    roleKeys
  )) as { id: string; key: string; name: string }[];

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = crypto.randomUUID();

  await query(
    `INSERT INTO User (id, email, username, password, name, position, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, email, username, hashedPassword, data.name, data.position ?? null, true]
  );

  for (const role of roleRows) {
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [id, role.id]);
  }

  const roles: AuthRole[] = [];
  for (const role of roleRows) {
    const permissionRows = (await query(
      `SELECT p.key
       FROM Permission p
       JOIN RolePermission rp ON rp.permissionId = p.id
       WHERE rp.roleId = ?`,
      [role.id]
    )) as { key: string }[];
    roles.push({
      id: role.id,
      key: role.key,
      name: role.name,
      permissions: permissionRows.map((p) => p.key),
    });
  }

  return {
    user: {
      id,
      email,
      username,
      name: data.name,
      position: data.position ?? null,
      avatarUrl: null,
      isActive: true,
    },
    roles,
  };
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const rows = (await query(`SELECT password FROM User WHERE id = ? LIMIT 1`, [userId])) as {
    password: string;
  }[];
  if (!rows[0]) {
    throw new ApiError(404, "User not found.");
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password);
  if (!valid) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE User SET password = ?, updatedAt = NOW() WHERE id = ?`, [hashed, userId]);
}

export async function buildMePayload(userId: string) {
  const user = await findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      position: user.position,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
    },
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      permissions: role.permissions.map((p) => p.permission.key),
    })),
  };
}
