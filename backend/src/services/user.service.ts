import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

const userInclude = {
  roles: {
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  },
} as const;

type RoleShape = {
  role: {
    id: string;
    key: string;
    name: string;
    permissions: { permission: { key: string } }[];
  };
};

function mapUser(u: {
  id: string;
  email: string;
  username: string;
  name: string;
  position: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  roles: RoleShape[];
}) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    position: u.position,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive,
    createdAt: u.createdAt,
    roles: u.roles.map(({ role }) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      permissions: role.permissions.map((p) => p.permission.key),
    })),
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: userInclude,
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => mapUser(u as unknown as Parameters<typeof mapUser>[0]));
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, include: userInclude });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return mapUser(user as unknown as Parameters<typeof mapUser>[0]);
}

export async function createUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  position?: string;
  roleIds: string[];
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }] },
  });
  if (existing) {
    throw new ApiError(409, "A user with this email or username already exists.");
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const createData: Record<string, unknown> = {
    name: data.name,
    email: data.email.toLowerCase(),
    username: data.username.toLowerCase(),
    password: hashedPassword,
    position: data.position ?? null,
    roles:
      data.roleIds.length > 0
        ? { create: data.roleIds.map((roleId) => ({ roleId })) }
        : undefined,
  };

  const user = await prisma.user.create({
    data: createData as never,
    include: userInclude,
  });

  return mapUser(user as unknown as Parameters<typeof mapUser>[0]);
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    position?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  }
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found.");
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password !== undefined && data.password !== "") {
    const bcrypt = await import("bcryptjs");
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  if (data.roleIds !== undefined) {
    updateData.roles = {
      deleteMany: {},
      create: data.roleIds.map((roleId) => ({ roleId })),
    };
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData as never,
    include: userInclude,
  });

  return mapUser(user as unknown as Parameters<typeof mapUser>[0]);
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found.");
  }
  await prisma.user.delete({ where: { id } });
}
