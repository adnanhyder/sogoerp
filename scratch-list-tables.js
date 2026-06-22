const { Client } = require('pg');
const client = new Client('postgresql://postgres:King%40Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres');
client.connect().then(() => client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")).then((res) => {console.log(res.rows.map(r => r.tablename).join(', ')); process.exit(0)}).catch(e => {console.error(e); process.exit(1)});
