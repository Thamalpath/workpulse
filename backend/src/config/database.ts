import "dotenv/config";

import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const host = process.env.DB_HOST ?? "127.0.0.1";
const port = Number(process.env.DB_PORT ?? "3306");
const user = process.env.DB_USERNAME ?? "root";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_DATABASE ?? "";

export const pool: Pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

export type { Pool, RowDataPacket };

export async function query<T extends RowDataPacket[]>(sql: string, params?: unknown[]) {
  const [rows] = await pool.execute<T>(sql, params as never);
  return rows;
}
