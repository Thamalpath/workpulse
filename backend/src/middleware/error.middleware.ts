import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found." });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: "Internal server error." });
}
