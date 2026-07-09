import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { InStockTable } from "./in-stock-table";
import { InStockFilters } from "./in-stock-filters";
import { PaginationControls } from "@/app/_components/pagination-controls";

export const dynamic = "force-dynamic";

type InStockPageProps = {
  searchParams?: Promise<{
    q?: string;
    condition?: string;
    has_mic?: string;
    page?: string;
  }>;
};

export default async function InStockPage({ searchParams }: InStockPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const condition = params?.condition?.trim() ?? "";
  const hasMicParam = params?.has_mic?.trim() ?? "";
  const requestedPage = Number(params?.page ?? "1");
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const pageSize = 20;

  // Fetch all in-stock devices to calculate metrics in memory
  const { data: allInStock, error: metricsError } = await supabase
    .from("devices")
    .select("id, imei, device_condition, purchase_cost, has_mic, created_at")
    .eq("custody_status", "company_hands");

  const totalInStock = allInStock?.length ?? 0;
  const newCount = allInStock?.filter((d) => d.device_condition === "new").length ?? 0;
  const refurbishedCount = allInStock?.filter((d) => d.device_condition === "refurbished" || d.device_condition === "used").length ?? 0;
  const faultyCount = allInStock?.filter((d) => d.device_condition === "faulty" || d.device_condition === "damaged").length ?? 0;

  // Filter devices by parameters if provided
  let filteredDevices = allInStock ?? [];

  if (condition) {
    filteredDevices = filteredDevices.filter(
      (d) => (d.device_condition || "").toLowerCase() === condition.toLowerCase()
    );
  }

  if (hasMicParam) {
    const hasMicBool = hasMicParam === "true";
    filteredDevices = filteredDevices.filter((d) => d.has_mic === hasMicBool);
  }

  if (q) {
    const searchLower = q.toLowerCase();
    filteredDevices = filteredDevices.filter((d) => d.imei.toLowerCase().includes(searchLower));
  }

  const totalFilteredDevices = filteredDevices.length;
  const paginatedDevices = filteredDevices.slice((page - 1) * pageSize, page * pageSize);

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

      {/* Search & Filters */}
      <InStockFilters
        initialQ={q}
        initialCondition={condition}
        initialHasMic={hasMicParam}
      />

      {/* Table Section */}
      <InStockTable devices={paginatedDevices} />
      <PaginationControls
        currentPage={page}
        pageSize={pageSize}
        path="/inventory/in-stock"
        query={{ condition, has_mic: hasMicParam, q }}
        totalItems={totalFilteredDevices}
        totalPages={Math.max(1, Math.ceil(totalFilteredDevices / pageSize))}
      />
    </ErpShell>
  );
}
