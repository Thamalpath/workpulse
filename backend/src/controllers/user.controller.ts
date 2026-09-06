import type { Request, Response } from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  isAdminUser,
  listUsers,
  updateUser,
} from "../services/user.service.js";
import { ApiError } from "../utils/api-error.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

function isAdminAuthed(req: Request): boolean {
  return (req as AuthedRequest).roles?.includes("admin") ?? false;
}

async function ensureTargetVisible(req: Request, id: string) {
  if (!isAdminAuthed(req) && (await isAdminUser(id))) {
    throw new ApiError(404, "User not found.");
  }
}

export async function getUsers(req: Request, res: Response) {
  const isAdmin = isAdminAuthed(req);
  const scope = req.query.scope === "manage" ? "manage" : "members";

  if (scope === "manage") {
    const data = await listUsers(
      isAdmin ? {} : { excludeAdmins: true },
    );
    res.json({ success: true, data });
    return;
  }

  const data = await listUsers();
  res.json({ success: true, data });
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id as string;
  await ensureTargetVisible(req, id);
  const data = await getUserById(id);
  res.json({ success: true, data });
}

export async function postUser(req: Request, res: Response) {
  const { name, email, username, password, roleIds = [] } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
    roleIds?: string[];
  };

  const args: {
    name: string;
    email: string;
    username: string;
    password: string;
    roleIds: string[];
  } = { name, email, username, password, roleIds };

  const user = await createUser(args, { isAdmin: isAdminAuthed(req) });
  res.status(201).json({ success: true, data: user });
}

export async function patchUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as Request & { userId?: string }).userId;
  const isAdmin = isAdminAuthed(req);
  const { name, isActive, roleIds, password } = req.body as {
    name?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  };

  if (id === userId && (isActive === false || roleIds !== undefined)) {
    throw new ApiError(400, "You cannot deactivate or change roles for your own account.");
  }

  await ensureTargetVisible(req, id);

  const args: {
    name?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  } = {};
  if (name !== undefined) args.name = name;
  if (isActive !== undefined) args.isActive = isActive;
  if (roleIds !== undefined) args.roleIds = roleIds;
  if (password !== undefined && password !== "") args.password = password;

  const user = await updateUser(id, args, { isAdmin });
  res.json({ success: true, data: user });
}

export async function removeUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as Request & { userId?: string }).userId;
  if (id === userId) {
    throw new ApiError(400, "You cannot delete your own account.");
  }
  await ensureTargetVisible(req, id);
  await deleteUser(id);
  res.json({ success: true, message: "User deleted." });
}
