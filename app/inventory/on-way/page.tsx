import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { OnWayTable } from "./on-way-table";
import { Search } from "lucide-react";

type OnWayPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function OnWayPage({ searchParams }: OnWayPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";

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
  
  // Calculate unique couriers
  const couriers = allOnWay
    ?.map((d) => d.courier_company)
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0) ?? [];
  const uniqueCouriers = new Set(couriers).size;

  // Filter devices by search term if provided
  let filteredDevices = allOnWay ?? [];
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

      {/* Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative flex flex-1 max-w-md items-center" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search IMEI, consignment, or courier..."
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black"
          />
          <Search className="absolute left-3 size-4 text-gray-400" strokeWidth={2.2} />
        </form>
      </div>

      {/* Table Section */}
      <OnWayTable initialDevices={filteredDevices as any} />
    </ErpShell>
  );
}
