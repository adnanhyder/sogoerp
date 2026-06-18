const fs = require('fs');
let content = fs.readFileSync('c:/laragon/www/sogoerp/lib/erp-queries.ts', 'utf8');

const target = `    if (!leadId || followUps.has(leadId)) {
      continue;
    }

  supabase: SupabaseClient,
  technicianIds: string[],
  statuses: string[],
) {
  const counts = new Map<string, number>();`;

const replacement = `    if (!leadId || followUps.has(leadId)) {
      continue;
    }

    followUps.set(leadId, formatDateTime(String(row.next_follow_up_at ?? "")));
  }

  return followUps;
}

async function assignedTasksByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const tasks = new Map<string, string>();
  if (!technicianIds.length) return tasks;
  
  const { data, error } = await supabase
    .from("devices")
    .select("technician_id,imei,status,customers(full_name)")
    .in("technician_id", technicianIds);
  
  if (!error && data) {
    for (const row of data) {
      if (row.status === "installed" || row.status === "active") continue;
      
      const tid = String(row.technician_id);
      const imei = String(row.imei || "Unknown Device");
      const customerName = relatedField(row.customers, "full_name");
      const status = String(row.status || "").replaceAll("_", " ");
      
      const taskDesc = customerName ? \`\${imei} (For: \${customerName}) - \${status}\` : \`\${imei} - \${status}\`;
      const current = tasks.get(tid);
      tasks.set(tid, current ? \`\${current}\\n\${taskDesc}\` : taskDesc);
    }
  }
  return tasks;
}

async function deviceCountsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("devices")
    .select("technician_id")
    .eq("custody_status", "technician_hands")
    .in("technician_id", technicianIds);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    counts.set(technicianId, (counts.get(technicianId) ?? 0) + 1);
  }

  return counts;
}

async function disputedDeviceCountsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("devices")
    .select("technician_id")
    .in("technician_id", technicianIds)
    .or("status.ilike.%disputed%,status.ilike.%fault%,status.ilike.%faulty%,status.ilike.%issue%,status.ilike.%returned%,status.ilike.%replaced%");

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    counts.set(technicianId, (counts.get(technicianId) ?? 0) + 1);
  }

  return counts;
}

async function workOrderCountsByTechnician(
  supabase: SupabaseClient,
  technicianIds: string[],
  statuses: string[],
) {
  const counts = new Map<string, number>();`;

content = content.replace(target, replacement);
fs.writeFileSync('c:/laragon/www/sogoerp/lib/erp-queries.ts', content);
