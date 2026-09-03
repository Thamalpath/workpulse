import bcrypt from "bcryptjs";

import { prisma } from "../config/database.js";
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

type UserWithRoles = {
  id: string;
  email: string;
  username: string;
  name: string;
  position: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: {
    role: {
      id: string;
      key: string;
      name: string;
      permissions: { permission: { key: string } }[];
    };
  }[];
};

const includeRoles = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} as const;

function sanitizeUser(user: UserWithRoles): { user: AuthUser; roles: AuthRole[] } {
  const roles: AuthRole[] = user.roles.map(({ role }) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    permissions: role.permissions.map((p) => p.permission.key),
  }));

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
    roles,
  };
}

export async function findByEmailOrUsername(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    include: includeRoles,
  });
}

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: includeRoles,
  });
}

export async function registerUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  position?: string;
  roleKeys?: string[];
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
    },
  });

  if (existing) {
    throw new ApiError(409, "A user with this email or username already exists.");
  }

  const roleKeys = data.roleKeys && data.roleKeys.length > 0 ? data.roleKeys : DEFAULT_ROLE_KEYS;
  const roles = await prisma.role.findMany({
    where: { key: { in: roleKeys } },
    select: { id: true },
  });

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const createData: Record<string, unknown> = {
    name: data.name,
    email: data.email.toLowerCase(),
    username: data.username.toLowerCase(),
    password: hashedPassword,
    position: data.position ?? null,
    roles:
      roles.length > 0
        ? { create: roles.map((r) => ({ roleId: r.id })) }
        : undefined,
  };

  const user = await prisma.user.create({
    data: createData as never,
    include: includeRoles,
  });

  return sanitizeUser(user as UserWithRoles);
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

export async function buildMePayload(userId: string) {
  const user = await findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return sanitizeUser(user as UserWithRoles);
}
