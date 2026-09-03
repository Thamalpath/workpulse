import bcrypt from "bcryptjs";

import { pool, query } from "./config/database.js";
import { SEED_PERMISSIONS, SEED_ROLES } from "./constants/permissions.js";

async function seed() {
  console.log("Seeding permissions...");
  const permissionIds: Record<string, string> = {};
  for (const perm of SEED_PERMISSIONS) {
    const existing = (await query(
      `SELECT id FROM Permission WHERE key = ? LIMIT 1`,
      [perm.key]
    )) as { id: string }[];

    if (existing[0]) {
      await query(
        `UPDATE Permission SET name = ?, module = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
        [perm.name, perm.module, perm.description, existing[0].id]
      );
      permissionIds[perm.key] = existing[0].id;
    } else {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO Permission (id, name, key, description, module) VALUES (?, ?, ?, ?, ?)`,
        [id, perm.name, perm.key, perm.description, perm.module]
      );
      permissionIds[perm.key] = id;
    }
  }

  console.log("Seeding roles...");
  for (const role of SEED_ROLES) {
    const existing = (await query(
      `SELECT id FROM Role WHERE key = ? LIMIT 1`,
      [role.key]
    )) as { id: string }[];

    if (existing[0]) {
      await query(
        `UPDATE Role SET name = ?, description = ?, isSystem = ?, updatedAt = NOW() WHERE id = ?`,
        [role.name, role.description, 1, existing[0].id]
      );
    } else {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO Role (id, name, key, description, isSystem) VALUES (?, ?, ?, ?, ?)`,
        [id, role.name, role.key, role.description, 1]
      );
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [id, permissionIds[key]!]
        );
      }
    }
  }

  console.log("Syncing role permissions...");
  for (const role of SEED_ROLES) {
    const roleRows = (await query(
      `SELECT id FROM Role WHERE key = ? LIMIT 1`,
      [role.key]
    )) as { id: string }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      continue;
    }
    const countRows = (await query(
      `SELECT COUNT(*) AS count FROM RolePermission WHERE roleId = ?`,
      [roleId]
    )) as { count: number }[];
    const permissionCount = Number(countRows[0]?.count ?? 0);

    if (permissionCount !== role.permissionKeys.length) {
      await query(`DELETE FROM RolePermission WHERE roleId = ?`, [roleId]);
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [roleId, permissionIds[key]!]
        );
      }
    }
  }

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@workpulse.com";
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const adminRoleRows = (await query(
    `SELECT id FROM Role WHERE key = 'admin' LIMIT 1`
  )) as { id: string }[];
  const adminRoleId = adminRoleRows[0]?.id;

  const existingAdminRows = (await query(
    `SELECT id FROM User WHERE email = ? LIMIT 1`,
    [adminEmail]
  )) as { id: string }[];

  if (existingAdminRows[0]) {
    if (adminRoleId) {
      await query(`DELETE FROM UserRole WHERE userId = ?`, [existingAdminRows[0].id]);
      await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
        existingAdminRows[0].id,
        adminRoleId,
      ]);
    }
    console.log("Admin user already exists.");
  } else if (adminRoleId) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO User (id, name, email, username, password, position, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, "Admin", adminEmail, adminUsername, hashed, "Administrator", 1]
    );
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [id, adminRoleId]);
    console.log("Admin user created.");
  }

  console.log("Seeding complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => query(`SELECT 1`).then(() => pool.end()));
