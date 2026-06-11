import { Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AdminRecordsPanel } from "./admin-records-panel";
import { ErpShell } from "./erp-shell";
import { CreateRecordForm } from "./create-record-form";
import { CustomerRecordActions } from "./customer-record-actions";
import { InventoryRecordActions } from "./inventory-record-actions";
import { LeadRecordActions } from "./lead-record-actions";
import { TechnicianRecordActions } from "./technician-record-actions";
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
  searchQuery?: string;
  tableColumns: readonly string[];
  tableRows: readonly (readonly string[])[];
  title: string;
  user: User;
  workflows: readonly string[];
};

function inventoryChipClass(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("company")) {
    return "border-[#d2d2d2] bg-white text-black";
  }

  if (normalized.includes("way")) {
    return "border-black bg-black text-white";
  }

  if (normalized.includes("technician")) {
    return "border-[#343434] bg-[#343434] text-white";
  }

  if (normalized.includes("clear")) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (normalized.includes("disputed") || normalized.includes("fault") || normalized.includes("issue")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#d2d2d2] bg-[#fbfbfb] text-[#343434]";
}

export function ModulePage({
  activeHref,
  createConfig,
  databaseError,
  description,
  metrics,
  primaryAction,
  searchQuery = "",
  tableColumns,
  tableRows,
  title,
  user,
  workflows,
}: ModulePageProps) {
  const isInventory = activeHref === "/inventory";
  const isLeads = activeHref === "/leads";
  const isCustomers = activeHref === "/customers";
  const isTechnicians = activeHref === "/technicians";
  const isCoreAdmin = ["/inventory", "/leads", "/technicians", "/customers"].includes(activeHref);
  function renderInventoryCell(cell: string, index: number) {
    if (index === 0) {
      return <span className="font-bold tracking-[-0.01em] text-black">{cell}</span>;
    }

    if (index === 1) {
      return (
        <span
          className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${inventoryChipClass(cell)}`}
        >
          {cell}
        </span>
      );
    }

    if (index === 2) {
      return (
        <span
          className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${inventoryChipClass(cell)}`}
        >
          {cell}
        </span>
      );
    }

    if (index === 3) {
      const hasMic = cell.toLowerCase() === "yes";

      return (
        <span
          className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold ${
            hasMic
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-[#d2d2d2] bg-[#fbfbfb] text-[#777777]"
          }`}
        >
          {cell}
        </span>
      );
    }

    if (index === 4 || index === 6 || index === 7) {
      return <span className="font-bold tabular-nums text-black">{cell}</span>;
    }

    if (index === 5 || index === 8) {
      return <span className="text-xs font-semibold text-[#777777]">{cell}</span>;
    }

    return <span>{cell}</span>;
  }

  const recordsTable = (
    <div className={isCoreAdmin ? "overflow-hidden rounded-[8px] border border-[#eeeeee]" : "overflow-x-auto"}>
      <table
        className={`w-full border-collapse text-left text-sm ${
          isInventory ? "min-w-[920px]" : isCoreAdmin ? "min-w-[900px]" : "min-w-[720px]"
        }`}
      >
        <thead className={isCoreAdmin ? "bg-[#fbfbfb] text-[#343434]" : "text-[#343434]"}>
          <tr>
            {tableColumns.map((column) => (
              <th
                className={`font-medium ${
                  isCoreAdmin
                    ? "border-b border-[#eeeeee] px-4 py-3 text-xs uppercase tracking-[0.08em] text-[#777777]"
                    : "pb-4"
                }`}
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.length ? (
            tableRows.map((row) => {
              const visibleCells = isInventory
                ? row.slice(4)
                : isTechnicians
                  ? [row[6] ?? "", row[8] ?? "", row[9] ?? "", row[10] ?? "", row[13] ?? "", row[14] ?? ""]
                  : isLeads
                    ? [row[3] ?? "", row[4] ?? "", row[7] ?? "", row[8] ?? "", row[10] ?? "", row[11] ?? "", row[12] ?? ""]
                    : isCustomers
                      ? [row[1] ?? "", row[2] ?? "", row[7] ?? "", row[8] ?? "", row[11] ?? "", row[12] ?? "", row[13] ?? ""]
                      : row;
              const inventoryId = row[0] ?? "";
              const inventoryStatus = row[1] ?? "";
              const inventoryCustodyStatus = row[2] ?? "company_hands";
              const inventoryTechnicianId = row[3] ?? "";
              const inventoryImei = row[4] ?? "";
              const inventoryHasMic = row[7] ?? "No";
              const inventoryPurchaseCost = row[11] ?? "0";
              const technicianId = row[0] ?? "";
              const technicianActive = row[1] === "true";
              const technicianDisputed = row[2] === "true";
              const technicianAuthCnic = row[3] ?? "";
              const technicianAuthRelation = row[4] ?? "";

              return (
                <tr
                  className={`border-t border-[#eeeeee] ${
                    isCoreAdmin ? "transition hover:bg-[#fbfbfb]" : ""
                  }`}
                  key={row.join("-")}
                >
                  {visibleCells.map((cell, index) => (
                    <td
                      className={`${
                        isCoreAdmin ? "px-4 py-4 align-middle" : "py-4"
                      } ${
                        index === 0 && !isInventory ? "font-semibold text-black" : "text-[#343434]"
                      }`}
                      key={`${cell}-${index}`}
                    >
                      {isInventory ? renderInventoryCell(cell, index) : cell}
                    </td>
                  ))}
                  {isInventory ? (
                    <td className="px-4 py-4 align-middle">
                      <InventoryRecordActions
                        custodyStatus={inventoryCustodyStatus}
                        hasMic={inventoryHasMic === "Yes"}
                        id={inventoryId}
                        imei={inventoryImei}
                        purchaseCost={inventoryPurchaseCost}
                        status={inventoryStatus}
                        technicianId={inventoryTechnicianId}
                      />
                    </td>
                  ) : null}
                  {isLeads ? (
                    <td className="px-4 py-4 align-middle">
                      <LeadRecordActions
                        budget={row[9] ?? "0"}
                        followUpAt={row[2] ?? ""}
                        id={row[0] ?? ""}
                        location={row[7] ?? ""}
                        name={row[3] ?? "Lead"}
                        phone={row[4] ?? ""}
                        source={row[6] ?? ""}
                        stage={row[1] ?? "new_lead"}
                        vehicleType={row[8] ?? ""}
                        whatsapp={row[5] ?? ""}
                      />
                    </td>
                  ) : null}
                  {isCustomers ? (
                    <td className="px-4 py-4 align-middle">
                      <CustomerRecordActions
                        customerId={row[0] ?? ""}
                        location={`${row[7] ?? ""} ${row[6] ?? ""} ${row[5] ?? ""}`}
                        name={row[1] ?? "Customer"}
                      />
                    </td>
                  ) : null}
                  {isTechnicians ? (
                    <td className="px-4 py-4 align-middle">
                      <TechnicianRecordActions
                        active={technicianActive}
                        authorizationPersonCnic={technicianAuthCnic}
                        authorizationPersonName={row[11] ?? ""}
                        authorizationPersonPhone={row[5] ?? ""}
                        authorizationRelation={technicianAuthRelation}
                        cities={row[8] ?? ""}
                        cnic={row[7] ?? ""}
                        commissionRate={row[12] ?? "0"}
                        disputed={technicianDisputed}
                        id={technicianId}
                        name={row[6] ?? ""}
                        phone={row[9] ?? ""}
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })
          ) : (
            <tr className="border-t border-[#eeeeee]">
              <td
                className="px-4 py-12 text-center text-sm font-semibold text-[#777777]"
                colSpan={tableColumns.length}
              >
                <span className="mx-auto block max-w-sm rounded-[8px] border border-dashed border-[#d2d2d2] bg-[#fbfbfb] px-5 py-6">
                  No database records found yet.
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (isCoreAdmin) {
    return (
      <ErpShell activeHref={activeHref} title={title} user={user}>
        <div className="space-y-3">
          {databaseError ? (
            <section className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 text-sm font-semibold text-black">
              Database setup needed: {databaseError}
            </section>
          ) : null}

          <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
            <AdminRecordsPanel
              actionLabel={primaryAction}
              config={createConfig}
              eyebrow={isInventory ? "Admin Inventory" : "Admin Records"}
              searchAction={isInventory ? "/inventory" : undefined}
              searchPlaceholder="Search IMEI, status, custody..."
              searchQuery={searchQuery}
              title={`${title} Records`}
            >
              {recordsTable}
            </AdminRecordsPanel>
          </article>

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
        </div>
      </ErpShell>
    );
  }

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
            {createConfig && !isInventory ? (
              <a
                href="#create-record"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white"
              >
                <Plus className="size-4" />
                {primaryAction}
              </a>
            ) : null}
          </div>
          {createConfig && isInventory ? (
            <details
              className="mt-5 rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfb] p-3"
              id="create-record"
            >
              <summary className="inline-flex h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                <Plus className="size-4" />
                Add Device
              </summary>
              <CreateRecordForm config={createConfig} />
            </details>
          ) : createConfig ? (
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
            {recordsTable}
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
