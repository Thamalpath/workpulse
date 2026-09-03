import type { Request, Response } from "express";

import {
  buildMePayload,
  changePassword as changePasswordService,
  findByEmailOrUsername,
  registerUser,
  verifyPassword,
} from "../services/auth.service.js";
import { ApiError } from "../utils/api-error.js";
import { clearAuthCookie, COOKIE_NAME, setAuthCookie } from "../utils/cookie.js";
import { signToken } from "../utils/jwt.js";

export async function register(req: Request, res: Response) {
  const { name, email, username, password, position, roleKeys } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
    position?: string;
    roleKeys?: string[];
  };

  const args: {
    name: string;
    email: string;
    username: string;
    password: string;
    position?: string;
    roleKeys?: string[];
  } = { name, email, username, password };
  if (position !== undefined) args.position = position;
  if (roleKeys !== undefined) args.roleKeys = roleKeys;

  const result = await registerUser(args);

  const token = signToken(result.user.id);
  setAuthCookie(res, token);

  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body as {
    identifier: string;
    password: string;
  };

  const user = await findByEmailOrUsername(identifier);
  if (!user) {
    throw new ApiError(401, "Invalid credentials.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated.");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const roles = user.roles.map(({ role }) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    permissions: role.permissions.map((p) => p.permission.key),
  }));

  const token = signToken(user.id);
  setAuthCookie(res, token);

  res.json({
    success: true,
    data: {
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
    },
  });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out." });
}

export async function me(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw new ApiError(401, "Not authenticated.");
  }
  const data = await buildMePayload(userId);
  res.json({ success: true, data });
}

export async function changePassword(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    throw new ApiError(401, "Not authenticated.");
  }
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  await changePasswordService(userId, currentPassword, newPassword);

  res.json({ success: true, message: "Password updated." });
}

export { COOKIE_NAME };
