import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const [key, ...valueParts] = line.split("=");
    process.env[key.trim()] ??= valueParts.join("=").trim();
  }
}

const connectionString = process.env.DATABASE_URL;
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const res = await client.query("SELECT * FROM public.activity_events ORDER BY created_at DESC LIMIT 30");
  console.log("Recent activity events in database:", res.rows);
} finally {
  await client.end();
}
