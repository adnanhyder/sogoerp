import { requireUser } from "@/lib/auth";
import { ErpShell } from "@/app/_components/erp-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

import { ViewDetailsModal } from "./view-details-modal";

export default async function TechnicianActivityPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch recent work orders for technicians
  const { data: workOrders, error: workOrdersError } = await supabase
    .from("work_orders")
    .select(`
      id,
      status,
      completed_at,
      scheduled_at,
      technicians(name),
      customers(full_name, location)
    `)
    .not("technician_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch recent device transfers
  const { data: transfers, error: transfersError } = await supabase
    .from("device_transfers")
    .select(`
      id,
      status,
      departed_at,
      received_at,
      devices(imei),
      technicians!device_transfers_from_technician_id_fkey(name),
      toTech:technicians!device_transfers_to_technician_id_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (workOrdersError || transfersError) {
    return (
      <ErpShell activeHref="/technicians/records" title="Technician Activity Logs" user={user}>
        <div className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 text-sm font-semibold text-black">
          Error loading activity: {workOrdersError?.message || transfersError?.message}
        </div>
      </ErpShell>
    );
  }

  // Combine and sort by date
  const activities = [
    ...(workOrders || []).map((w: any) => ({
      type: "work_order",
      date: w.completed_at || w.scheduled_at || new Date().toISOString(),
      techName: w.technicians?.name || "Unknown",
      description: `Work Order ${w.status} for ${w.customers?.full_name || "Customer"}`,
      raw: w,
    })),
    ...(transfers || []).map((t: any) => ({
      type: "transfer",
      date: t.received_at || t.departed_at || new Date().toISOString(),
      techName: t.toTech?.name || t.technicians?.name || "Unknown",
      description: `Device Transfer (${t.devices?.imei}): ${t.status === "received" ? "Received by " + t.toTech?.name : "Sent by " + t.technicians?.name}`,
      raw: t,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ErpShell activeHref="/technicians/records" title="Technician Activity Logs" user={user}>
      <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
        <h3 className="mb-6 text-lg font-bold text-black">Recent Technician Activity</h3>
        
        {activities.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-gray-200 p-8 text-center text-sm font-medium text-gray-500">
            No recent work or activity recorded for technicians.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 rounded-[12px] border border-gray-100 bg-[#fbfbfb] p-4 transition hover:bg-white hover:shadow-sm">
                <div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${activity.type === 'work_order' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {activity.type === 'work_order' ? '🛠️' : '📦'}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{activity.techName}</p>
                  <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                  <p className="mt-2 text-xs font-semibold text-gray-400">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
                <div className="ml-auto flex items-center self-center pl-4">
                  <ViewDetailsModal activity={activity} />
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </ErpShell>
  );
}
