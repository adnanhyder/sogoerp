const { Client } = require('pg');

async function checkDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    
    // Check devices with on_the_way custody
    const res = await client.query(`
      SELECT id, imei, custody_status, courier_company, consignment_number, technician_id 
      FROM devices 
      WHERE custody_status = 'on_the_way'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log("Devices On The Way:");
    console.table(res.rows);

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkDb();
