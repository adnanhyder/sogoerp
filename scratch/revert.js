const { Client } = require('pg');

async function revert() {
  const client = new Client({
    connectionString: 'postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    
    await client.query(`
      UPDATE devices 
      SET custody_status = 'company_hands', courier_company = null, consignment_number = null 
      WHERE imei = '1000000001'
    `);
    
    console.log("Reverted");

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

revert();
