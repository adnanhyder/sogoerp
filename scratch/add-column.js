const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:King@Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log("Connected to database. Altering table...");
  try {
    await client.query(`ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS dispute_reason text;`);
    console.log("Successfully added dispute_reason column to technicians table.");
  } catch (err) {
    console.error("Error adding column:", err.message);
  } finally {
    await client.end();
  }
}

main();
