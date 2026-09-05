import type { Request, Response } from "express";

import {
  createPermission,
  deletePermission,
  getPermissionById,
  listPermissions,
  updatePermission,
} from "../services/permission.service.js";

export async function getPermissions(_req: Request, res: Response) {
  const data = await listPermissions();
  res.json({ success: true, data });
}

export async function getPermission(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = await getPermissionById(id);
  res.json({ success: true, data });
}

export async function postPermission(req: Request, res: Response) {
  const { name, key, module, description } = req.body as {
    name: string;
    key: string;
    module: string;
    description?: string;
  };
  const args: { name: string; key: string; module: string; description?: string } = {
    name,
    key,
    module,
  };
  if (description !== undefined) args.description = description;

  const permission = await createPermission(args);
  res.status(201).json({ success: true, data: permission });
}

export async function patchPermission(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name, key, module, description } = req.body as {
    name?: string;
    key?: string;
    module?: string;
    description?: string;
  };
  const args: { name?: string; key?: string; module?: string; description?: string } = {};
  if (name !== undefined) args.name = name;
  if (key !== undefined) args.key = key;
  if (module !== undefined) args.module = module;
  if (description !== undefined) args.description = description;

  const permission = await updatePermission(id, args);
  res.json({ success: true, data: permission });
}

export async function removePermission(req: Request, res: Response) {
  const id = req.params.id as string;
  await deletePermission(id);
  res.json({ success: true, message: "Permission deleted." });
}