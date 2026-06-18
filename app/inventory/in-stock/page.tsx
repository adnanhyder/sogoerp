import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { InStockTable } from "./in-stock-table";
import { Search } from "lucide-react";

type InStockPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function InStockPage({ searchParams }: InStockPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";

  // Fetch all in-stock devices to calculate metrics in memory
  const { data: allInStock, error: metricsError } = await supabase
    .from("devices")
    .select("id, imei, device_condition, purchase_cost, has_mic, created_at")
    .eq("custody_status", "company_hands");

  const totalInStock = allInStock?.length ?? 0;
  const newCount = allInStock?.filter((d) => d.device_condition === "new").length ?? 0;
  const refurbishedCount = allInStock?.filter((d) => d.device_condition === "refurbished" || d.device_condition === "used").length ?? 0;
  const faultyCount = allInStock?.filter((d) => d.device_condition === "faulty" || d.device_condition === "damaged").length ?? 0;

  // Filter devices by search term if provided
  let filteredDevices = allInStock ?? [];
  if (q) {
    const searchLower = q.toLowerCase();
    filteredDevices = filteredDevices.filter((d) => d.imei.toLowerCase().includes(searchLower));
  }

  return (
    <ErpShell activeHref="/inventory/in-stock" title="Inventory In Stock" user={user}>
      {/* Metrics Section */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total In Stock</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-black">{totalInStock}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Ready in office warehouse</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Brand New</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-green-600">{newCount}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Unused pristine condition</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Refurbished & Used</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-yellow-600">{refurbishedCount}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Verified working spares</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Faulty & Damaged</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-red-600">{faultyCount}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">Requires RMA or repair</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative flex flex-1 max-w-md items-center" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search IMEI..."
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black"
          />
          <Search className="absolute left-3 size-4 text-gray-400" strokeWidth={2.2} />
        </form>
      </div>

      {/* Table Section */}
      <InStockTable initialDevices={filteredDevices} />
    </ErpShell>
  );
}
