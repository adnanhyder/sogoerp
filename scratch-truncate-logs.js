const { Client } = require('pg');
const client = new Client('postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres');
client.connect()
  .then(() => client.query("TRUNCATE TABLE lead_follow_ups, activity_events, audit_logs, communication_logs CASCADE;"))
  .then(() => {console.log("Truncated notifications and logs"); process.exit(0)})
  .catch(e => {console.error(e); process.exit(1)});
