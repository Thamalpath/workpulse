import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../../generated/prisma/client.js";

const host = process.env.DB_HOST ?? "127.0.0.1";
const port = process.env.DB_PORT ?? "3306";
const user = process.env.DB_USERNAME ?? "root";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_DATABASE ?? "";

const adapterUrl = `mariadb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

const adapter = new PrismaMariaDb(adapterUrl);

export const prisma = new PrismaClient({ adapter });
