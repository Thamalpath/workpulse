import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const host = process.env.DB_HOST;
const port = Number(process.env.DB_PORT);
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;

async function main() {
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });
  console.log(`Connected to ${database}`);

  const sqlFiles = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  for (const file of sqlFiles) {
    const sql = fs.readFileSync(path.join(__dirname, file), "utf8");
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Applying ${file} (${statements.length} statements)...`);
    for (const statement of statements) {
      await connection.query(statement);
    }
  }

  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  await connection.end();
  console.log("Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
