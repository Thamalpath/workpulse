import bcrypt from "bcryptjs";

import { insert, pool, query } from "./config/database.js";
import { SEED_PERMISSIONS, SEED_ROLES } from "./constants/permissions.js";

const SEED_PROJECTS = [
  {
    name: "Ceylon Traders Website",
    description: "Marketing site rebuild for Ceylon Traders",
  },
  {
    name: "Internal Dev Tools",
    description: "Internal dashboards and developer tooling",
  },
  {
    name: "AI Assistant R&D",
    description: "Exploratory work on the AI chat feature",
  },
];

const SEED_USERS: {
  name: string;
  email: string;
  username: string;
  roleKey: string;
}[] = [
  {
    name: "Nirosha Wickramasinghe",
    email: "nirosha@workpulse.dev",
    username: "nirosha",
    roleKey: "manager",
  },
  {
    name: "Kasun Perera",
    email: "kasun@workpulse.dev",
    username: "kaasun",
    roleKey: "team-member",
  },
  {
    name: "Dilani Rathnayake",
    email: "dilani@workpulse.dev",
    username: "dilani",
    roleKey: "team-member",
  },
  {
    name: "Chathura Jayasuriya",
    email: "chathura@workpulse.dev",
    username: "chathura",
    roleKey: "team-member",
  },
  {
    name: "Nadeeka Silva",
    email: "nadeeka@workpulse.dev",
    username: "nadeeka",
    roleKey: "team-member",
  },
];

const SEED_USER_PASSWORD = "123456";

async function seed() {
  console.log("Seeding permissions...");
  const permissionIds: Record<string, string> = {};
  for (const perm of SEED_PERMISSIONS) {
    const existing = (await query(
      `SELECT id FROM Permission WHERE \`key\` = ? LIMIT 1`,
      [perm.key],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Permission SET name = ?, module = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
        [perm.name, perm.module, perm.description, existing[0].id],
      );
      permissionIds[perm.key] = String(existing[0].id);
    } else {
      const id = await insert(
        `INSERT INTO Permission (name, \`key\`, description, module) VALUES (?, ?, ?, ?)`,
        [perm.name, perm.key, perm.description, perm.module],
      );
      permissionIds[perm.key] = String(id);
    }
  }

  console.log("Seeding roles...");
  for (const role of SEED_ROLES) {
    const existing = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [role.key],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Role SET name = ?, description = ?, updatedAt = NOW() WHERE id = ?`,
        [role.name, role.description, existing[0].id],
      );
    } else {
      const id = await insert(
        `INSERT INTO Role (name, \`key\`, description) VALUES (?, ?, ?)`,
        [role.name, role.key, role.description],
      );
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [id, permissionIds[key]!],
        );
      }
    }
  }

  console.log("Syncing role permissions...");
  for (const role of SEED_ROLES) {
    const roleRows = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [role.key],
    )) as { id: string | number }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      continue;
    }
    const countRows = (await query(
      `SELECT COUNT(*) AS count FROM RolePermission WHERE roleId = ?`,
      [roleId],
    )) as { count: number }[];
    const permissionCount = Number(countRows[0]?.count ?? 0);

    if (permissionCount !== role.permissionKeys.length) {
      await query(`DELETE FROM RolePermission WHERE roleId = ?`, [roleId]);
      for (const key of role.permissionKeys) {
        await query(
          `INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)`,
          [roleId, permissionIds[key]!],
        );
      }
    }
  }

  console.log("Seeding admin user...");
  const adminEmail = "admin@workpulse.com";
  const adminUsername = "admin";
  const adminPassword = "1234";

  const adminRoleRows = (await query(
    `SELECT id FROM Role WHERE \`key\` = 'admin' LIMIT 1`,
  )) as { id: string | number }[];
  const adminRoleId = adminRoleRows[0]?.id;

  const existingAdminRows = (await query(
    `SELECT id FROM User WHERE email = ? LIMIT 1`,
    [adminEmail],
  )) as { id: string | number }[];

  if (existingAdminRows[0]) {
    if (adminRoleId) {
      await query(`DELETE FROM UserRole WHERE userId = ?`, [
        existingAdminRows[0].id,
      ]);
      await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
        existingAdminRows[0].id,
        adminRoleId,
      ]);
    }
    console.log("Admin user already exists.");
  } else if (adminRoleId) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    const id = await insert(
      `INSERT INTO User (name, email, username, password, isActive)
       VALUES (?, ?, ?, ?, ?)`,
      ["Sampath Gunawardena", adminEmail, adminUsername, hashed, 1],
    );
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
      id,
      adminRoleId,
    ]);
    console.log("Admin user created.");
  }

  console.log("Seeding team users...");
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10);
  for (const user of SEED_USERS) {
    const roleRows = (await query(
      `SELECT id FROM Role WHERE \`key\` = ? LIMIT 1`,
      [user.roleKey],
    )) as { id: string | number }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      console.warn(`Role "${user.roleKey}" not found for ${user.username}. Skipping.`);
      continue;
    }

    const existing = (await query(
      `SELECT id FROM User WHERE username = ? OR email = ? LIMIT 1`,
      [user.username, user.email],
    )) as { id: string | number }[];

    let userId: string | number;
    if (existing[0]) {
      userId = existing[0].id;
      await query(
        `UPDATE User SET name = ?, email = ?, username = ?, password = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
        [user.name, user.email, user.username, passwordHash, userId],
      );
    } else {
      userId = await insert(
        `INSERT INTO User (name, email, username, password, isActive)
         VALUES (?, ?, ?, ?, 1)`,
        [user.name, user.email, user.username, passwordHash],
      );
    }

    await query(`DELETE FROM UserRole WHERE userId = ?`, [userId]);
    await query(`INSERT INTO UserRole (userId, roleId) VALUES (?, ?)`, [
      userId,
      roleId,
    ]);
    console.log(`Seeded user ${user.username} (${user.roleKey}).`);
  }

  console.log("Seeding projects...");
  for (const proj of SEED_PROJECTS) {
    const existing = (await query(
      `SELECT id FROM Project WHERE name = ? LIMIT 1`,
      [proj.name],
    )) as { id: string | number }[];

    if (existing[0]) {
      await query(
        `UPDATE Project SET name = ?, description = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
        [proj.name, proj.description, existing[0].id],
      );
    } else {
      await insert(
        `INSERT INTO Project (name, description, isActive) VALUES (?, ?, 1)`,
        [proj.name, proj.description],
      );
    }
  }

  console.log("Seeding complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => query(`SELECT 1`).then(() => pool.end()));
