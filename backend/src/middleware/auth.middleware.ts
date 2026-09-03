import type { NextFunction, Request, Response } from "express";

import { findById } from "../services/auth.service.js";
import { ApiError } from "../utils/api-error.js";
import { COOKIE_NAME } from "../utils/cookie.js";
import { verifyToken } from "../utils/jwt.js";

export type AuthedRequest = Request & {
  userId?: string;
  roles?: string[];
  permissions?: string[];
};

async function attachAuth(req: AuthedRequest, res: Response, next: NextFunction, required: boolean) {
  const token =
    (req.cookies?.[COOKIE_NAME] as string | undefined) ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    if (!required) {
      return next();
    }
    return next(new ApiError(401, "Authentication required."));
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (!required) {
      return next();
    }
    return next(new ApiError(401, "Invalid or expired session."));
  }

  const user = await findById(payload.sub);
  if (!user || !user.isActive) {
    return next(new ApiError(401, "Session user no longer exists."));
  }

  req.userId = user.id;
  req.roles = user.roles.map(({ role }) => role.key);
  req.permissions = user.roles.flatMap(({ role }) =>
    role.permissions.map((p) => p.permission.key)
  );
  next();
}

export function authenticate(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    void attachAuth(req as AuthedRequest, res, next, required);
  };
}

export function requireRole(...roleKeys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authed = req as AuthedRequest;
    const roles = authed.roles ?? [];

    if (roles.includes("admin") || roleKeys.some((r) => roles.includes(r))) {
      return next();
    }

    return next(new ApiError(403, "You do not have permission to perform this action."));
  };
}

export function requirePermission(...permissionKeys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authed = req as AuthedRequest;
    const permissions = authed.permissions ?? [];

    if (permissions.some((p) => permissionKeys.includes(p))) {
      return next();
    }

    return next(new ApiError(403, "You do not have permission to perform this action."));
  };
}
