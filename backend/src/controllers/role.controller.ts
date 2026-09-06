import type { Request, Response } from "express";

import {
  createRole,
  deleteRole,
  getRoleById,
  listRoles,
  updateRole,
} from "../services/role.service.js";
import { listPermissions } from "../services/permission.service.js";
import { ApiError } from "../utils/api-error.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

function callerRoles(req: Request): string[] {
  return (req as AuthedRequest).roles ?? [];
}

function isAdminAuthed(req: Request): boolean {
  return callerRoles(req).includes("admin");
}

export async function getRoles(req: Request, res: Response) {
  const hiddenKeys = isAdminAuthed(req)
    ? []
    : Array.from(new Set(["admin", ...callerRoles(req)]));
  const data = await listRoles({ hideRoleKeys: hiddenKeys });
  res.json({ success: true, data });
}

export async function getAssignments(req: Request, res: Response) {
  const hiddenKeys = isAdminAuthed(req)
    ? []
    : Array.from(new Set(["admin", ...callerRoles(req)]));
  const [roles, permissions] = await Promise.all([
    listRoles({ hideRoleKeys: hiddenKeys }),
    listPermissions(),
  ]);
  res.json({ success: true, data: { roles, permissions } });
}

export async function patchRolePermissions(req: Request, res: Response) {
  const id = req.params.id as string;
  const { permissionIds } = req.body as { permissionIds: string[] };

  if (!isAdminAuthed(req)) {
    const current = await getRoleById(id);
    if (callerRoles(req).includes(current.key)) {
      throw new ApiError(403, "You cannot modify your own role.");
    }
  }

  const role = await updateRole(id, { permissionIds });
  res.json({ success: true, data: role });
}

export async function getRole(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = await getRoleById(id);
  if (!isAdminAuthed(req) && callerRoles(req).includes(data.key)) {
    throw new ApiError(404, "Role not found.");
  }
  res.json({ success: true, data });
}

export async function postRole(req: Request, res: Response) {
  const { name, key, description, permissionIds = [] } = req.body as {
    name: string;
    key: string;
    description?: string;
    permissionIds?: string[];
  };
  const args: { name: string; key: string; description?: string; permissionIds: string[] } = {
    name,
    key,
    permissionIds,
  };
  if (description !== undefined) args.description = description;

  const role = await createRole(args);
  res.status(201).json({ success: true, data: role });
}

export async function patchRole(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name, description, permissionIds } = req.body as {
    name?: string;
    description?: string;
    permissionIds?: string[];
  };

  if (!isAdminAuthed(req)) {
    const current = await getRoleById(id);
    if (callerRoles(req).includes(current.key)) {
      throw new ApiError(403, "You cannot modify your own role.");
    }
  }

  const args: { name?: string; description?: string; permissionIds?: string[] } = {};
  if (name !== undefined) args.name = name;
  if (description !== undefined) args.description = description;
  if (permissionIds !== undefined) args.permissionIds = permissionIds;

  const role = await updateRole(id, args);
  res.json({ success: true, data: role });
}

export async function removeRole(req: Request, res: Response) {
  const id = req.params.id as string;
  if (!isAdminAuthed(req)) {
    const current = await getRoleById(id);
    if (callerRoles(req).includes(current.key)) {
      throw new ApiError(403, "You cannot delete your own role.");
    }
  }
  await deleteRole(id);
  res.json({ success: true, message: "Role deleted." });
}

export async function getPermissions(_req: Request, res: Response) {
  const data = await listPermissions();
  res.json({ success: true, data });
}