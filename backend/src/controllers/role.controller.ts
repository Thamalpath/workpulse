import type { Request, Response } from "express";

import {
  createRole,
  deleteRole,
  getRoleById,
  listPermissions,
  listRoles,
  updateRole,
} from "../services/role.service.js";

export async function getRoles(_req: Request, res: Response) {
  const data = await listRoles();
  res.json({ success: true, data });
}

export async function getRole(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = await getRoleById(id);
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
  const args: { name?: string; description?: string; permissionIds?: string[] } = {};
  if (name !== undefined) args.name = name;
  if (description !== undefined) args.description = description;
  if (permissionIds !== undefined) args.permissionIds = permissionIds;

  const role = await updateRole(id, args);
  res.json({ success: true, data: role });
}

export async function removeRole(req: Request, res: Response) {
  const id = req.params.id as string;
  await deleteRole(id);
  res.json({ success: true, message: "Role deleted." });
}

export async function getPermissions(_req: Request, res: Response) {
  const data = await listPermissions();
  res.json({ success: true, data });
}
