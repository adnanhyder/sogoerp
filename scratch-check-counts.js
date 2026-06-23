const { Client } = require('pg');
const client = new Client('postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres');

async function main() {
  await client.connect();
  const tables = [
    'activity_events',
    'devices',
    'leads',
    'customers',
    'support_tickets',
    'lead_follow_ups',
    'customer_meetings',
    'customer_records_history',
    'work_orders',
    'commissions',
    'finances'
  ];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = res.rows[0].count;
      console.log(`${table}: ${count} rows`);
      if (count > 0 && (table === 'activity_events' || table === 'devices' || table === 'leads' || table === 'customers' || table === 'support_tickets')) {
        const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
        console.log(`  Sample ${table}:`, sample.rows);
      }
    } catch (e) {
      console.error(`Error querying ${table}:`, e.message);
    }
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
