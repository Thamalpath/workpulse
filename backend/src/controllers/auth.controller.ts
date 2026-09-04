import type { Request, Response } from "express";

import {
  buildMePayload,
  changePassword as changePasswordService,
  findByEmailOrUsername,
  registerUser,
  verifyPassword,
} from "../services/auth.service.js";
import {
  createSession,
  deleteAllUserSessions,
  deleteSession,
} from "../services/session.service.js";
import { ApiError } from "../utils/api-error.js";
import {
  clearSessionCookie,
  setSessionCookie,
  SESSION_COOKIE,
} from "../utils/cookie.js";
import { signToken } from "../utils/jwt.js";

export async function register(req: Request, res: Response) {
  const { name, email, username, password } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
  };

  const args: {
    name: string;
    email: string;
    username: string;
    password: string;
  } = { name, email, username, password };

  const result = await registerUser(args);

  const jwtExpiry = process.env.JWT_EXPIRES_IN ?? "7d";
  const session = await createSession(result.user.id, req.ip, req.headers["user-agent"]);
  const jwt = signToken(result.user.id, session.token, jwtExpiry);
  setSessionCookie(res, jwt, jwtExpiry);

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

  const jwtExpiry = process.env.JWT_EXPIRES_IN ?? "7d";
  const session = await createSession(user.id, req.ip, req.headers["user-agent"]);
  const jwt = signToken(user.id, session.token, jwtExpiry);
  setSessionCookie(res, jwt, jwtExpiry);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        isActive: user.isActive,
      },
      roles,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const jwtToken =
    (req.cookies?.[SESSION_COOKIE] as string | undefined) ?? undefined;

  if (jwtToken) {
    try {
      const { verifyToken } = await import("../utils/jwt.js");
      const payload = verifyToken(jwtToken);
      if (payload) {
        await deleteSession(payload.jti);
      }
    } catch {
      // ignore
    }
  }

  clearSessionCookie(res);
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
  await deleteAllUserSessions(userId);
  clearSessionCookie(res);

  res.json({ success: true, message: "Password updated. Please sign in again." });
}
