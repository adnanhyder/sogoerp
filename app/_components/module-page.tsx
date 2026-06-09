import { Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ErpShell } from "./erp-shell";
import { CreateRecordForm } from "./create-record-form";
import { InventoryRecordActions } from "./inventory-record-actions";
import type { CreateConfig } from "@/lib/create-config";

type ModuleMetric = {
  label: string;
  value: string;
  detail: string;
};

type ModulePageProps = {
  activeHref: string;
  createConfig?: CreateConfig;
  databaseError?: string | null;
  description: string;
  metrics: readonly ModuleMetric[];
  primaryAction: string;
  tableColumns: readonly string[];
  tableRows: readonly (readonly string[])[];
  title: string;
  user: User;
  workflows: readonly string[];
};

export function ModulePage({
  activeHref,
  createConfig,
  databaseError,
  description,
  metrics,
  primaryAction,
  tableColumns,
  tableRows,
  title,
  user,
  workflows,
}: ModulePageProps) {
  const isInventory = activeHref === "/inventory";

  return (
    <ErpShell activeHref={activeHref} title={title} user={user}>
      <div className="space-y-3">
        <section className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-[#777777]">ERP Module</p>
              <h2 className="mt-2 text-[28px] font-bold tracking-[-0.02em] text-black">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{description}</p>
            </div>
            <a
              href={createConfig ? "#create-record" : "#"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white"
            >
              <Plus className="size-4" />
              {primaryAction}
            </a>
          </div>
          {createConfig ? (
            <div id="create-record">
              <CreateRecordForm config={createConfig} />
            </div>
          ) : null}
        </section>

        {databaseError ? (
          <section className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 text-sm font-semibold text-black">
            Database setup needed: {databaseError}
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              className="rounded-[8px] border border-[#d2d2d2] bg-white p-5"
              key={metric.label}
            >
              <p className="text-sm font-medium text-[#777777]">{metric.label}</p>
              <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em] text-black">
                {metric.value}
              </p>
              <p className="mt-5 text-sm font-semibold text-[#343434]">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">{title} Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="text-[#343434]">
                  <tr>
                    {tableColumns.map((column) => (
                      <th className="pb-4 font-medium" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length ? (
                    tableRows.map((row) => {
                      const visibleCells = isInventory ? row.slice(1) : row;
                      const inventoryId = row[0] ?? "";
                      const inventoryStatus = row[2] ?? "";

                      return (
                        <tr className="border-t border-[#eeeeee]" key={row.join("-")}>
                          {visibleCells.map((cell, index) => (
                            <td
                              className={`py-4 ${
                                index === 0 ? "font-semibold text-black" : "text-[#343434]"
                              }`}
                              key={`${cell}-${index}`}
                            >
                              {cell}
                            </td>
                          ))}
                          {isInventory ? (
                            <td className="py-4">
                              <InventoryRecordActions id={inventoryId} status={inventoryStatus} />
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-t border-[#eeeeee]">
                      <td className="py-8 text-center text-sm font-semibold text-[#777777]" colSpan={tableColumns.length}>
                        No database records found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
            <h3 className="text-lg font-bold text-black">Expected Workflow</h3>
            <div className="mt-5 space-y-3">
              {workflows.map((workflow, index) => (
                <div className="flex gap-3" key={workflow}>
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-black text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6 text-[#343434]">{workflow}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </ErpShell>
  );
}
