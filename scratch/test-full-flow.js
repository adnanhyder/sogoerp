const { Client } = require('pg');

async function testFullFlow() {
  const client = new Client({
    connectionString: 'postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
  });

  try {
    await client.connect();

    // 1. Get an existing device
    const res = await client.query(`
      SELECT id, imei FROM devices LIMIT 1
    `);
    const deviceId = res.rows[0].id;
    console.log("Testing on device:", deviceId);

    // 2. Perform an update via pg directly to set it to on the way with TCS
    await client.query(`
      UPDATE devices 
      SET custody_status = 'on_the_way', courier_company = 'TCS', consignment_number = '12345678901'
      WHERE id = $1
    `, [deviceId]);

    // 3. Verify it was saved
    const verify = await client.query(`
      SELECT custody_status, courier_company, consignment_number 
      FROM devices WHERE id = $1
    `, [deviceId]);
    console.log("After update:", verify.rows[0]);

  } catch (err) {
    console.error('Error:', err.stack);
  } finally {
    await client.end();
  }
}

testFullFlow();
