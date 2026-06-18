const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:King@Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const authRes = await client.query("SELECT * FROM auth.users");
  const admin = authRes.rows.find(u => u.email === 'raheel@xpertcodes.com');
  
  if (admin) {
      console.log('Found admin:', admin.id);
      
      // Delete all other users from auth.users
      await client.query("DELETE FROM auth.users WHERE id != $1", [admin.id]);
      console.log('Deleted all other auth.users');
      
      // Ensure admin is in profiles
      try {
          await client.query("INSERT INTO public.profiles (id, role) VALUES ($1, 'admin') ON CONFLICT (id) DO NOTHING", [admin.id]);
          console.log('Ensured admin is in profiles');
      } catch(e) {
          console.log('Could not insert profile:', e.message);
      }
  } else {
      console.log('Admin not found in auth.users');
  }
  await client.end();
}
run();
