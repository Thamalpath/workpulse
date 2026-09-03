import "dotenv/config";

import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

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

export type { Pool, ResultSetHeader, RowDataPacket };

export async function query<T extends RowDataPacket[]>(sql: string, params?: unknown[]) {
  const [rows] = await pool.execute<T>(sql, params as never);
  return rows;
}

export async function insert(sql: string, params?: unknown[]): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params as never);
  return result.insertId;
}

export type TransactionExec = {
  rows: <T extends RowDataPacket[]>(sql: string, params?: unknown[]) => Promise<T>;
  run: (sql: string, params?: unknown[]) => Promise<void>;
  insertId: (sql: string, params?: unknown[]) => Promise<number>;
};

export async function withTransaction<T>(fn: (exec: TransactionExec) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const exec: TransactionExec = {
      rows: async <T extends RowDataPacket[]>(sql: string, params?: unknown[]) => {
        const [rows] = await connection.execute<T>(sql, params as never);
        return rows;
      },
      run: async (sql: string, params?: unknown[]) => {
        await connection.execute(sql, params as never);
      },
      insertId: async (sql: string, params?: unknown[]) => {
        const [result] = await connection.execute<ResultSetHeader>(sql, params as never);
        return result.insertId;
      },
    };
    const result = await fn(exec);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}