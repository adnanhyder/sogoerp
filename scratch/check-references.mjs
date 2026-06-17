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
  const meetings = await client.query("SELECT id, lead_id, customer_id, outcome FROM public.customer_meetings");
  console.log("Customer Meetings:", meetings.rows);

  const workOrders = await client.query("SELECT id, lead_id, customer_id FROM public.work_orders");
  console.log("Work Orders:", workOrders.rows);
} finally {
  await client.end();
}
