import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { Search } from "lucide-react";

type ReceivedPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function ReceivedPage({ searchParams }: ReceivedPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";

  // Fetch all devices that have custody_status = 'received_by_technician'
  const { data: allReceived, error } = await supabase
    .from("devices")
    .select(`
      id,
      imei,
      device_condition,
      created_at,
      technician_id,
      technicians(name, cities)
    `)
    .eq("custody_status", "received_by_technician")
    .order("created_at", { ascending: false });

  const totalReceived = allReceived?.length ?? 0;

  // Extract unique technician IDs to calculate handheld counts
  const technicianIds = Array.from(
    new Set(
      (allReceived ?? [])
        .map((d) => d.technician_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const activeTechsCount = technicianIds.length;
  const avgDevicesPerTech = activeTechsCount > 0 ? (totalReceived / activeTechsCount).toFixed(1) : "0";

  // Query counts of all devices currently with these technicians (either received or on the way)
  const counts = new Map<string, number>();
  if (technicianIds.length) {
    const { data: countsData } = await supabase
      .from("devices")
      .select("technician_id")
      .in("custody_status", ["received_by_technician", "on_the_way"])
      .in("technician_id", technicianIds);

    for (const row of countsData ?? []) {
      const tid = String(row.technician_id);
      counts.set(tid, (counts.get(tid) ?? 0) + 1);
    }
  }

  // Filter devices by search term if provided
  let filteredDevices = allReceived ?? [];
  if (q) {
    const searchLower = q.toLowerCase();
    filteredDevices = filteredDevices.filter((d) => {
      const techObj = Array.isArray(d.technicians) ? d.technicians[0] : (d.technicians as any);
      const nameMatch = techObj?.name?.toLowerCase().includes(searchLower) ?? false;
      const cityMatch = techObj?.cities?.toLowerCase().includes(searchLower) ?? false;
      const imeiMatch = d.imei.toLowerCase().includes(searchLower);
      return nameMatch || cityMatch || imeiMatch;
    });
  }

  // Helper function for condition tag styling
  const conditionChipClass = (cond: string) => {
    const normalized = (cond || "new").toLowerCase();
    if (normalized === "new") return "border-green-200 bg-green-50 text-green-700";
    if (normalized === "refurbished") return "border-blue-200 bg-blue-50 text-blue-700";
    if (normalized === "used") return "border-yellow-200 bg-yellow-50 text-yellow-700";
    return "border-red-200 bg-red-50 text-red-700";
  };

  return (
    <ErpShell activeHref="/inventory/received" title="Inventory Received by Techs" user={user}>
      {/* Metrics Section */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Received</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-black">{totalReceived}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Devices held by technicians in field</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Technicians</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600">{activeTechsCount}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Technicians holding inventory</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Devices / Tech</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-yellow-600">{avgDevicesPerTech}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Average inventory count per person</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative flex flex-1 max-w-md items-center" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search IMEI, technician name, or city..."
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black"
          />
          <Search className="absolute left-3 size-4 text-gray-400" strokeWidth={2.2} />
        </form>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
        <table className="w-full border-collapse text-left text-sm min-w-[850px]">
          <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Technician</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">City</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Device Condition</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-right">Handheld Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDevices.length ? (
              filteredDevices.map((device) => {
                const techObj = Array.isArray(device.technicians) ? device.technicians[0] : (device.technicians as any);
                const techName = techObj?.name || "Unknown Technician";
                const techCities = techObj?.cities || "—";
                const condition = device.device_condition || "new";
                const handheldCount = device.technician_id ? (counts.get(device.technician_id) ?? 0) : 0;

                return (
                  <tr
                    className="border-t border-gray-100 transition hover:bg-[#fbfbfb]/80"
                    key={device.id}
                  >
                    <td className="px-6 py-4.5 align-middle font-bold text-black tracking-[-0.01em]">
                      {device.imei}
                    </td>
                    <td className="px-6 py-4.5 align-middle font-semibold text-black">
                      👷 {techName}
                    </td>
                    <td className="px-6 py-4.5 align-middle font-medium text-gray-500">
                      {techCities}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span
                        className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${conditionChipClass(
                          condition
                        )}`}
                      >
                        {condition}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle text-right font-bold text-black tabular-nums">
                      {handheldCount}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#777777]">
                  No received devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ErpShell>
  );
}
