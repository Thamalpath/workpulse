import type { Request, Response } from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../services/user.service.js";
import { ApiError } from "../utils/api-error.js";

export async function getUsers(_req: Request, res: Response) {
  const data = await listUsers();
  res.json({ success: true, data });
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const data = await getUserById(id);
  res.json({ success: true, data });
}

export async function postUser(req: Request, res: Response) {
  const { name, email, username, password, position, roleIds = [] } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
    position?: string;
    roleIds?: string[];
  };

  const args: {
    name: string;
    email: string;
    username: string;
    password: string;
    position?: string;
    roleIds: string[];
  } = { name, email, username, password, roleIds };
  if (position !== undefined) args.position = position;

  const user = await createUser(args);
  res.status(201).json({ success: true, data: user });
}

export async function patchUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as Request & { userId?: string }).userId;
  const { name, position, isActive, roleIds, password } = req.body as {
    name?: string;
    position?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  };

  if (id === userId && (isActive === false || roleIds !== undefined)) {
    throw new ApiError(400, "You cannot deactivate or change roles for your own account.");
  }

  const args: {
    name?: string;
    position?: string;
    isActive?: boolean;
    roleIds?: string[];
    password?: string;
  } = {};
  if (name !== undefined) args.name = name;
  if (position !== undefined) args.position = position;
  if (isActive !== undefined) args.isActive = isActive;
  if (roleIds !== undefined) args.roleIds = roleIds;
  if (password !== undefined && password !== "") args.password = password;

  const user = await updateUser(id, args);
  res.json({ success: true, data: user });
}

export async function removeUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as Request & { userId?: string }).userId;
  if (id === userId) {
    throw new ApiError(400, "You cannot delete your own account.");
  }
  await deleteUser(id);
  res.json({ success: true, message: "User deleted." });
}
