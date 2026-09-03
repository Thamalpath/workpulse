import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type RoleWithData = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { id: string; key: string; name: string; module: string; description: string | null } }[];
  _count?: { users: number };
};

function mapRole(role: RoleWithData) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions.map((rp) => ({
      id: rp.permission.id,
      key: rp.permission.key,
      name: rp.permission.name,
      module: rp.permission.module,
      description: rp.permission.description,
    })),
    userCount: role._count?.users ?? 0,
  };
}

const includePerms = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} as const;

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: includePerms,
    orderBy: { createdAt: "asc" },
  });
  return roles.map((r) => mapRole(r as unknown as RoleWithData));
}

export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({ where: { id }, include: includePerms });
  if (!role) {
    throw new ApiError(404, "Role not found.");
  }
  return mapRole(role as unknown as RoleWithData);
}

export async function createRole(data: {
  name: string;
  key: string;
  description?: string;
  permissionIds: string[];
}) {
  const existing = await prisma.role.findUnique({ where: { key: data.key } });
  if (existing) {
    throw new ApiError(409, "A role with this key already exists.");
  }

  const createData: Record<string, unknown> = {
    name: data.name,
    key: data.key,
    description: data.description ?? null,
    permissions:
      data.permissionIds.length > 0
        ? { create: data.permissionIds.map((permissionId) => ({ permissionId })) }
        : undefined,
  };

  const role = await prisma.role.create({
    data: createData as never,
    include: includePerms,
  });

  return mapRole(role as unknown as RoleWithData);
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] }
) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Role not found.");
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissionIds !== undefined) {
    updateData.permissions = {
      deleteMany: {},
      create: data.permissionIds.map((permissionId) => ({ permissionId })),
    };
  }

  const role = await prisma.role.update({
    where: { id },
    data: updateData as never,
    include: includePerms,
  });

  return mapRole(role as unknown as RoleWithData);
}

export async function deleteRole(id: string) {
  const existing = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "Role not found.");
  }
  if (existing.isSystem) {
    throw new ApiError(400, "System roles cannot be deleted.");
  }
  if (existing._count.users > 0) {
    throw new ApiError(400, "Role is assigned to users and cannot be deleted.");
  }
  await prisma.role.delete({ where: { id } });
}

export async function listPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
  return permissions.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    module: p.module,
    description: p.description,
  }));
}
