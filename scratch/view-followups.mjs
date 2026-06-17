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
if (!connectionString) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const res = await client.query("SELECT id, reason, next_follow_up_at, seen, created_at FROM public.lead_follow_ups");
  console.log("Lead Follow-ups:");
  console.log(JSON.stringify(res.rows, null, 2));
} catch (err) {
  console.error("Error querying lead_follow_ups:", err);
} finally {
  await client.end();
}
