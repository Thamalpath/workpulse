import bcrypt from "bcryptjs";

import { prisma } from "./config/database.js";
import { SEED_PERMISSIONS, SEED_ROLES } from "./constants/permissions.js";

async function seed() {
  console.log("Seeding permissions...");
  const permissionIds: Record<string, string> = {};
  for (const perm of SEED_PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: {
        key: perm.key,
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
    });
    permissionIds[perm.key] = created.id;
  }

  console.log("Seeding roles...");
  for (const role of SEED_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description, isSystem: true },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
        permissions: {
          create: role.permissionKeys.map((key) => ({ permissionId: permissionIds[key]! })),
        },
      },
    });
  }

  console.log("Syncing role permissions...");
  for (const role of SEED_ROLES) {
    const existing = await prisma.role.findUnique({
      where: { key: role.key },
      include: { permissions: { select: { permissionId: true } } },
    });
    if (existing && existing.permissions.length !== role.permissionKeys.length) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          permissions: {
            deleteMany: {},
            create: role.permissionKeys.map((key) => ({ permissionId: permissionIds[key]! })),
          },
        },
      });
    }
  }

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@workpulse.com";
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    if (adminRole) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          roles: {
            deleteMany: {},
            create: [{ roleId: adminRole.id }],
          },
        },
      });
    }
    console.log("Admin user already exists.");
  } else if (adminRole) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        username: adminUsername,
        password: hashed,
        position: "Administrator",
        isActive: true,
        roles: { create: [{ roleId: adminRole.id }] },
      },
    });
    console.log("Admin user created.");
  }

  console.log("Seeding complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
