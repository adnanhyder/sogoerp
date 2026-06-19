import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { OnWayTable } from "./on-way-table";
import { OnWayFilters } from "./on-way-filters";

export const dynamic = "force-dynamic";

type OnWayPageProps = {
  searchParams?: Promise<{
    q?: string;
    courier?: string;
    technician_id?: string;
  }>;
};

export default async function OnWayPage({ searchParams }: OnWayPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const courier = params?.courier?.trim() ?? "";
  const technicianId = params?.technician_id?.trim() ?? "";

  // Fetch all on-the-way devices to calculate metrics in memory
  const { data: allOnWay, error } = await supabase
    .from("devices")
    .select(`
      id,
      imei,
      consignment_number,
      courier_company,
      created_at,
      technician_id,
      technicians(name)
    `)
    .eq("custody_status", "on_the_way");

  const totalOnWay = allOnWay?.length ?? 0;
  
  // Calculate unique couriers for metrics and filter options
  const couriers = allOnWay
    ?.map((d) => d.courier_company?.trim())
    .filter((c): c is string => typeof c === "string" && c.length > 0) ?? [];
  const uniqueCouriersList = Array.from(new Set(couriers)).sort();
  const uniqueCouriers = uniqueCouriersList.length;

  // Calculate unique technicians for the filter options
  const technicianMap = new Map<string, string>();
  for (const d of allOnWay ?? []) {
    if (d.technician_id) {
      const techObj = Array.isArray(d.technicians) ? d.technicians[0] : d.technicians;
      const techName = techObj?.name || "Unknown Technician";
      technicianMap.set(d.technician_id, techName);
    }
  }
  const uniqueTechniciansList = Array.from(technicianMap.entries()).map(([id, name]) => ({
    id,
    name,
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Filter devices by parameters if provided
  let filteredDevices = allOnWay ?? [];

  if (courier) {
    filteredDevices = filteredDevices.filter(
      (d) => (d.courier_company || "").toLowerCase() === courier.toLowerCase()
    );
  }

  if (technicianId) {
    filteredDevices = filteredDevices.filter((d) => d.technician_id === technicianId);
  }

  if (q) {
    const searchLower = q.toLowerCase();
    filteredDevices = filteredDevices.filter(
      (d) =>
        d.imei.toLowerCase().includes(searchLower) ||
        (d.consignment_number && d.consignment_number.toLowerCase().includes(searchLower)) ||
        (d.courier_company && d.courier_company.toLowerCase().includes(searchLower))
    );
  }

  return (
    <ErpShell activeHref="/inventory/on-way" title="Inventory On Way" user={user}>
      {/* Metrics Section */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total in Transit</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-black">{totalOnWay}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Devices on the way to technicians</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Couriers</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600">{uniqueCouriers}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Courier companies delivering parcels</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Handovers</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-yellow-600">{totalOnWay}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Awaiting technician confirmation</p>
        </div>
      </div>

      {/* Search & Filters */}
      <OnWayFilters
        initialQ={q}
        initialCourier={courier}
        initialTechnicianId={technicianId}
        courierOptions={uniqueCouriersList}
        technicianOptions={uniqueTechniciansList}
      />

      {/* Table Section */}
      <OnWayTable devices={filteredDevices as any} />
    </ErpShell>
  );
}
