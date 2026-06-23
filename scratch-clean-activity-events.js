const { Client } = require('pg');
const client = new Client('postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres');

async function main() {
  await client.connect();
  
  // Fetch all activity events
  const res = await client.query('SELECT id, module_key, record_id, record_label FROM activity_events');
  console.log(`Found ${res.rows.length} total activity events.`);

  const toDelete = [];

  for (const row of res.rows) {
    let tableName = null;
    if (row.module_key === 'customers') {
      tableName = 'customers';
    } else if (row.module_key === 'inventory') {
      tableName = 'devices';
    } else if (row.module_key === 'leads') {
      tableName = 'leads';
    } else if (row.module_key === 'technicians') {
      tableName = 'technicians';
    } else if (row.module_key === 'support') {
      tableName = 'support_tickets';
    } else if (row.module_key === 'work_orders') {
      tableName = 'work_orders';
    }

    if (tableName) {
      // Check if record exists
      try {
        const checkRes = await client.query(`SELECT 1 FROM "${tableName}" WHERE id = $1`, [row.record_id]);
        if (checkRes.rows.length === 0) {
          console.log(`Orphaned event: ID ${row.id}, Module: ${row.module_key}, Record ID: ${row.record_id}, Label: "${row.record_label}" (Record does not exist in "${tableName}")`);
          toDelete.push(row.id);
        }
      } catch (err) {
        console.error(`Error checking existence in ${tableName}:`, err.message);
      }
    } else {
      console.log(`Unknown module_key: ${row.module_key} for event ${row.id}`);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} orphaned events...`);
    const deleteRes = await client.query('DELETE FROM activity_events WHERE id = ANY($1::uuid[])', [toDelete]);
    console.log(`Successfully deleted ${deleteRes.rowCount} orphaned events.`);
  } else {
    console.log('No orphaned events found.');
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
