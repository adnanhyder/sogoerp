const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres' });
  await client.connect();
  const lead = (await client.query("SELECT * FROM leads WHERE id='2f8c034e-b933-4e0b-95a9-c56b769941ff'")).rows[0];
  const custRes = await client.query("INSERT INTO customers (area, budget, full_name, location, phone, source_lead_id, vehicle_type, whatsapp, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id", [lead.location, lead.budget, lead.name, lead.location, lead.phone, lead.id, lead.vehicle_type, lead.whatsapp, lead.organization_id]);
  const custId = custRes.rows[0].id;
  const vehRes = await client.query("INSERT INTO vehicles (customer_id, vehicle_type, organization_id) VALUES ($1, $2, $3) RETURNING id", [custId, lead.vehicle_type, lead.organization_id]);
  const vehId = vehRes.rows[0].id;
  await client.query("INSERT INTO work_orders (customer_id, lead_id, status, vehicle_id, organization_id) VALUES ($1, $2, $3, $4, $5)", [custId, lead.id, 'assigned', vehId, lead.organization_id]);
  await client.query("UPDATE leads SET stage='installation_scheduled' WHERE id=$1", [lead.id]);
  console.log('Successfully converted Azan');
  await client.end();
}

run();
