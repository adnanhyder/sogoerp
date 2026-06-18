const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:King@Queen11@db.ybjjjllteaokuuysqahu.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  // Get all tables in public schema
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const tables = res.rows.map(r => r.table_name);
  console.log("Tables found:", tables);
  
  // Delete data from each table
  for (const table of tables) {
    if (table === "erp_users") {
        // Special case: don't delete the admin
        console.log(`Cleaning table ${table} except admin...`);
        // Let's delete all users except Raheela/raheel@xpertcodes.com
        // We'll check how erp_users are stored later if needed, but first let's just TRUNCATE the others.
    } else {
        console.log(`Truncating table ${table}...`);
        try {
            await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
            console.log(`Successfully truncated ${table}`);
        } catch (e) {
            console.error(`Failed to truncate ${table}:`, e.message);
        }
    }
  }

  // Handle erp_users separately
  try {
      // Find the admin user ID
      const adminRes = await client.query("SELECT * FROM erp_users");
      console.log("ERP Users before delete:", adminRes.rows);
      
      const authRes = await client.query("SELECT * FROM auth.users");
      console.log("Auth Users:", authRes.rows.map(u => ({ id: u.id, email: u.email })));
      
      const adminAuth = authRes.rows.find(u => u.email === 'raheel@xpertcodes.com');
      if (adminAuth) {
          console.log("Found admin user in auth.users:", adminAuth.id);
          // Delete all other users from public.erp_users
          await client.query("DELETE FROM erp_users WHERE id != $1", [adminAuth.id]);
          console.log("Deleted other erp_users");
          
          // Delete all other users from auth.users
          await client.query("DELETE FROM auth.users WHERE id != $1", [adminAuth.id]);
          console.log("Deleted other auth.users");
      } else {
          console.log("Admin user not found in auth.users!");
      }
  } catch (e) {
      console.error("Error handling users:", e.message);
  }

  await client.end();
}

run();
