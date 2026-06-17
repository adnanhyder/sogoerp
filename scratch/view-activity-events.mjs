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
  const res = await client.query("SELECT COUNT(*) FROM public.activity_events");
  console.log("Total activity events:", res.rows[0].count);
  const sample = await client.query("SELECT * FROM public.activity_events ORDER BY created_at DESC LIMIT 5");
  console.log("Sample activity events:", JSON.stringify(sample.rows, null, 2));
} catch (err) {
  console.error("Error querying activity_events:", err);
} finally {
  await client.end();
}
