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

const tables = [
  "organizations",
  "profiles",
  "suppliers",
  "technicians",
  "customers",
  "vehicles",
  "sims",
  "devices",
  "leads",
  "work_orders",
  "customer_meetings",
  "support_tickets",
  "finance_entries",
  "commissions",
  "communication_logs",
  "documents",
  "audit_logs",
  "lead_follow_ups"
];

try {
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM public.${table}`);
      console.log(`Table ${table}: ${res.rows[0].count} rows`);
    } catch (err) {
      console.log(`Table ${table} query failed: ${err.message}`);
    }
  }
} finally {
  await client.end();
}
