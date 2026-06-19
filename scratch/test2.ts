import { getModuleData } from './lib/erp-queries';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ybjjjllteaokuuysqahu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliampqbGx0ZWFva3V1eXNxYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAxNzYyNiwiZXhwIjoyMDU2NTkzNjI2fQ.yWl1u0Ff5nZfCjZ7bY8h7i_0kXlX0C_eX_0G5_r_oA0');

getModuleData(supabase, 'leads', {searchQuery: 'Azan'}).then(res => console.log(res.error));
