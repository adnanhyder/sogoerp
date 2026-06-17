const fs = require('fs');
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
let env = {};
lines.forEach(l => {
  const [k, ...v] = l.split('=');
  if (k) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('LEADS', Object.keys((await supabase.from('leads').select('*').limit(1)).data[0] || {}));
  console.log('CUSTOMERS', Object.keys((await supabase.from('customers').select('*').limit(1)).data[0] || {}));
  console.log('VEHICLES', Object.keys((await supabase.from('vehicles').select('*').limit(1)).data[0] || {}));
})();
