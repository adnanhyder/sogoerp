"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type InStockFiltersProps = {
  initialQ: string;
  initialCondition: string;
  initialHasMic: string;
};

export function InStockFilters({
  initialQ,
  initialCondition,
  initialHasMic,
}: InStockFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    const params = new URLSearchParams(window.location.search);
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = !!(initialQ || initialCondition || initialHasMic);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative flex flex-1 min-w-[240px] max-w-md items-center">
          <input
            type="text"
            name="q"
            defaultValue={initialQ}
            placeholder="Search IMEI..."
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black"
          />
          <Search className="absolute left-3 size-4 text-gray-400" strokeWidth={2.2} />
        </div>

        <select
          name="condition"
          value={initialCondition}
          onChange={(e) => handleFilterChange("condition", e.target.value)}
          className="rounded-[10px] border border-gray-200 bg-white py-2 px-3 text-sm font-semibold text-black outline-none transition focus:border-black cursor-pointer min-w-[150px]"
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
          <option value="faulty">Faulty</option>
          <option value="damaged">Damaged</option>
        </select>

        <select
          name="has_mic"
          value={initialHasMic}
          onChange={(e) => handleFilterChange("has_mic", e.target.value)}
          className="rounded-[10px] border border-gray-200 bg-white py-2 px-3 text-sm font-semibold text-black outline-none transition focus:border-black cursor-pointer min-w-[150px]"
        >
          <option value="">All Mic Statuses</option>
          <option value="true">With Mic</option>
          <option value="false">Without Mic</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 transition hover:bg-gray-50 hover:text-black"
          >
            Clear Filters
          </button>
        )}
      </form>
    </div>
  );
}
