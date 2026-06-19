import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { InstalledDevicesTable } from "@/app/_components/installed-devices-table";

export const dynamic = "force-dynamic";

export default async function InstalledPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch all successfully installed devices
  const { data: allInstalled, error } = await supabase
    .from("devices")
    .select(`
      id,
      status,
      custody_status,
      technician_id,
      imei,
      has_mic,
      purchase_cost,
      sale_price,
      installation_date,
      created_at,
      technicians(name, phone, cities),
      customers(full_name, phone, location)
    `)
    .eq("status", "installed")
    .order("installation_date", { ascending: false });

  // Map to the array of strings format expected by InstalledDevicesTable
  const rows = (allInstalled ?? []).map((row: any) => {
    const technicianId = row.technician_id || "";
    
    const relatedField = (relation: any, field: string) => {
      if (!relation) return null;
      if (Array.isArray(relation)) {
        return relation[0]?.[field] || null;
      }
      return relation[field] || null;
    };

    return [
      String(row.id ?? ""), // 0
      String(row.status ?? "-").replaceAll("_", " "), // 1
      String(row.custody_status ?? "company_hands"), // 2
      technicianId, // 3
      String(row.imei ?? "-"), // 4
      String(row.status ?? "-"), // 5
      "Customer Hands", // 6
      row.has_mic ? "Yes" : "No", // 7
      relatedField(row.technicians, "name") ?? "-", // 8
      relatedField(row.customers, "full_name") ?? "-", // 9
      relatedField(row.technicians, "cities") ?? "-", // 10
      "0", // 11
      String(row.purchase_cost ?? "0"), // 12
      String(row.created_at ?? ""), // 13
      relatedField(row.technicians, "phone") ?? "-", // 14
      relatedField(row.customers, "phone") ?? "-", // 15
      relatedField(row.customers, "location") ?? "-", // 16: customer city/location
      String(row.sale_price ?? "0"), // 17
      row.installation_date
        ? new Date(row.installation_date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "-", // 18
    ];
  });

  return (
    <ErpShell activeHref="/inventory/installed" title="Inventory Installed" user={user}>
      {error && (
        <div className="mb-6 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Error loading installed devices: {error.message}
        </div>
      )}

      {/* Installed Devices Table */}
      <InstalledDevicesTable columns={[]} rows={rows} />
    </ErpShell>
  );
}
