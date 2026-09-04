import crypto from "node:crypto";

import { query, insert } from "../config/database.js";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) return 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

export async function createSession(
  userId: string | number,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  const expiresAt = new Date(Date.now() + parseExpiryToMs(expiresIn));

  await insert(
    `INSERT INTO Session (userId, token, ipAddress, userAgent, expiresAt) VALUES (?, ?, ?, ?, ?)`,
    [userId, token, ipAddress ?? null, userAgent ?? null, expiresAt],
  );

  return { token, expiresAt };
}

export async function isSessionValid(token: string): Promise<boolean> {
  const rows = (await query(
    `SELECT 1 FROM Session WHERE token = ? AND expiresAt > NOW(3) LIMIT 1`,
    [token],
  )) as unknown[];
  return rows.length > 0;
}

export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM Session WHERE token = ?`, [token]);
}

export async function deleteAllUserSessions(userId: string | number): Promise<void> {
  await query(`DELETE FROM Session WHERE userId = ?`, [userId]);
}

export async function cleanExpiredSessions(): Promise<void> {
  await query(`DELETE FROM Session WHERE expiresAt < NOW()`, []);
}
