import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const targetPath = process.argv[2] ?? path.join("supabase", "schema.sql");
const schemaPath = path.resolve(root, targetPath);

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = line.split("=");
    process.env[key.trim()] ??= valueParts.join("=").trim();
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

await client.connect();
await client.query(fs.readFileSync(schemaPath, "utf8"));
await client.end();

console.log(`Supabase SQL applied successfully: ${targetPath}`);
