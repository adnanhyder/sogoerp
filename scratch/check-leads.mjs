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
  const leadsRes = await client.query("SELECT COUNT(*) FROM public.leads");
  console.log("Total leads in public.leads:", leadsRes.rows[0].count);

  const orgRes = await client.query("SELECT COUNT(*) FROM public.organizations");
  console.log("Total organizations:", orgRes.rows[0].count);

  const sampleLeads = await client.query("SELECT id, name, organization_id, stage FROM public.leads LIMIT 5");
  console.log("Sample Leads:", sampleLeads.rows);

} catch (err) {
  console.error("DB Query Error:", err);
} finally {
  await client.end();
}
