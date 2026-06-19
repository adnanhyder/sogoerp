"use client";

import { useState } from "react";
import { Plus, Search, ChevronUp, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AdminRecordsPanel } from "./admin-records-panel";
import { ErpShell } from "./erp-shell";
import { CreateRecordForm } from "./create-record-form";
import { CustomerRecordActions } from "./customer-record-actions";
import { InventoryRecordActions } from "./inventory-record-actions";
import { LeadRecordActions } from "./lead-record-actions";
import { TechnicianRecordActions } from "./technician-record-actions";

import { PaidCommissionsTable } from "./paid-commissions-table";
import { CompletedCustomersTable } from "./completed-customers-table";
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
  primaryAction?: string;
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isInventory = activeHref === "/inventory";
  const isLeads = activeHref === "/leads";
  const isCustomers = activeHref === "/customers";
  const isTechnicians = activeHref === "/technicians";
  const isCoreAdmin = ["/inventory", "/leads", "/technicians", "/customers"].includes(activeHref);
  
  const mainTableRows = isInventory
    ? tableRows.filter(row => row[1] !== "installed")
    : isCustomers
      ? tableRows.filter(row => row[14] !== "completed")
      : tableRows;


  const completedCustomers = isCustomers ? tableRows.filter(row => row[14] === "completed") : [];

  function renderInventoryCell(cell: string, index: number) {
    if (index === 0) {
      return <span className="font-bold tracking-[-0.01em] text-black whitespace-nowrap">{cell}</span>;
    }

    if (index === 1) {
      return (
        <span
          className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold capitalize ${inventoryChipClass(cell)}`}
        >
          {cell}
        </span>
      );
    }

    if (index === 2) {
      return (
        <span
          className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold capitalize ${inventoryChipClass(cell)}`}
        >
          {cell}
        </span>
      );
    }

    if (index === 3) {
      const hasMic = cell.toLowerCase() === "yes";

      return (
        <span
          className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${
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
      return <span className="font-bold tabular-nums text-black whitespace-nowrap">{cell}</span>;
    }

    if (index === 5 || index === 8) {
      return <span className="text-xs font-semibold text-[#777777] whitespace-nowrap">{cell}</span>;
    }

    if (index === 9) {
      return <span className="text-xs text-[#777777] whitespace-nowrap">{cell}</span>;
    }

    if (index === 10 || index === 11) {
      return <span className="text-xs font-semibold text-black whitespace-nowrap">{cell}</span>;
    }

    return <span className="whitespace-nowrap">{cell}</span>;
  }

  const recordsTable = (
    <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
      <table
        className={`w-full border-collapse text-left text-sm ${
          isInventory ? "min-w-[1550px]" : isCustomers ? "min-w-[1250px]" : isLeads ? "min-w-[1250px]" : isTechnicians ? "min-w-[1150px]" : isCoreAdmin ? "min-w-[1000px]" : "min-w-[720px]"
        }`}
      >
        <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
          <tr>
            {tableColumns.map((column) => (
              <th
                className="px-6 py-4 font-extrabold text-[#7a7a7a] whitespace-nowrap"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mainTableRows.length ? (
            mainTableRows.map((row) => {
              const visibleCells = isInventory
                ? [...row.slice(4, 14), row[19] || "-", row[20] || "-"]
                : isTechnicians
                  ? [row[6] ?? "", row[8] ?? "", row[9] ?? "", row[10] ?? "", row[11] ?? "", row[14] ?? "", row[15] ?? ""]
                  : isLeads
                    ? [row[3] ?? "", row[4] ?? "", row[7] ?? "", row[8] ?? "", row[14] ? `👷 ${row[14]}` : "—", row[11] ?? "", row[12] ?? ""]
                    : isCustomers
                      ? [row[1] ?? "", row[2] ?? "", row[7] ?? "", row[8] ?? "", row[9] ? `Rs. ${row[9]}` : "-", row[11] ?? "", row[16] ?? "", row[12] ?? "", row[13] ?? ""]
                      : row;
              const inventoryId = row[0] ?? "";
              const inventoryStatus = row[1] ?? "";
              const inventoryCustodyStatus = row[2] ?? "company_hands";
              const inventoryTechnicianId = row[3] ?? "";
              const inventoryImei = row[4] ?? "";
              const inventoryHasMic = row[7] ?? "No";
              const inventoryPurchaseCost = row[12] ?? "0";
              const technicianId = row[0] ?? "";
              const technicianActive = row[1] === "true";
              const technicianDisputed = row[2] === "true";
              const technicianAuthCnic = row[3] ?? "";
              const technicianAuthRelation = row[4] ?? "";

              return (
                <tr
                  className="border-t border-gray-100 transition hover:bg-[#fbfbfb]/80"
                  key={row.join("-")}
                >
                  {visibleCells.map((cell, index) => (
                    <td
                      className={`px-6 py-4.5 align-middle text-sm text-gray-700 whitespace-nowrap ${
                        index === 0 && !isInventory ? "font-bold text-black" : "font-medium"
                      }`}
                      key={`${cell}-${index}`}
                    >
                      {isInventory ? renderInventoryCell(cell, index) : cell}
                    </td>
                  ))}
                  {isInventory ? (
                    <td className="px-6 py-4.5 align-middle whitespace-nowrap">
                      <InventoryRecordActions
                        custodyStatus={inventoryCustodyStatus}
                        hasMic={inventoryHasMic === "Yes"}
                        id={inventoryId}
                        imei={inventoryImei}
                        purchaseCost={inventoryPurchaseCost}
                        status={inventoryStatus}
                        technicianId={inventoryTechnicianId}
                        consignmentNumber={row[19] ?? ""}
                        courierCompany={row[20] ?? ""}
                        sentByTechnicianId={row[21] ?? ""}
                      />
                    </td>
                  ) : null}
                  {isLeads ? (
                    <td className="px-6 py-4.5 align-middle whitespace-nowrap">
                      <LeadRecordActions
                        assignedDeviceId={row[15] ?? ""}
                        assignedDeviceImei={row[16] ?? ""}
                        consignmentNumber={row[17] ?? ""}
                        courierCompany={row[18] ?? ""}
                        assignedTechnicianId={row[13] ?? ""}
                        assignedTechnicianName={row[14] ?? ""}
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
                    <td className="px-6 py-4.5 align-middle whitespace-nowrap">
                      <CustomerRecordActions
                        customerId={row[0] ?? ""}
                        installStatus={row[14] ?? "none"}
                        location={`${row[7] ?? ""} ${row[6] ?? ""} ${row[5] ?? ""}`}
                        name={row[1] ?? "Customer"}
                        sourceLeadId={row[15] ?? ""}
                        assignedTechnicianId={row[17] ?? ""}
                        assignedDeviceId={row[18] ?? ""}
                      />
                    </td>
                  ) : null}
                  {isTechnicians ? (
                    <td className="px-6 py-4.5 align-middle whitespace-nowrap">
                      <TechnicianRecordActions
                        active={technicianActive}
                        authorizationPersonCnic={technicianAuthCnic}
                        authorizationPersonName={row[12] ?? ""}
                        authorizationPersonPhone={row[5] ?? ""}
                        authorizationRelation={technicianAuthRelation}
                        cities={row[8] ?? ""}
                        cnic={row[7] ?? ""}
                        commissionRate={row[13] ?? "0"}
                        disputed={technicianDisputed}
                        disputeReason={row[16] ?? ""}
                        id={technicianId}
                        name={row[6] ?? ""}
                        phone={row[9] ?? ""}
                        unpaidPending={Number(row[17] ?? 0)}
                        installedCount={Number(row[18] ?? 0)}
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })
          ) : (
            <tr className="border-t border-[#eeeeee]">
              <td
                className="px-6 py-12 text-center text-sm font-semibold text-gray-400 whitespace-nowrap"
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

          <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
            <AdminRecordsPanel
              actionLabel={primaryAction}
              config={createConfig}
              eyebrow={isInventory ? "Admin Inventory" : "Admin Records"}
              searchAction={activeHref}
              searchPlaceholder="Search records..."
              searchQuery={searchQuery}
              title={`${title} Records`}
            >
              {recordsTable}
            </AdminRecordsPanel>
          </article>



          {isTechnicians && (
            <PaidCommissionsTable />
          )}

          {isCustomers && completedCustomers.length > 0 ? (
            <CompletedCustomersTable columns={tableColumns} rows={completedCustomers} />
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article
                className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/50 transition hover:shadow-md hover:scale-[1.01]"
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
        <section className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-[#777777]">ERP Module</p>
              <h2 className="mt-2 text-[28px] font-bold tracking-[-0.02em] text-black">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{description}</p>
            </div>
            {createConfig ? (
              <button
                onClick={() => setIsCreateOpen(!isCreateOpen)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                type="button"
              >
                {isCreateOpen ? <ChevronUp className="size-4" /> : <Plus className="size-4" />}
                {isCreateOpen ? "Close Panel" : primaryAction || "Add Record"}
              </button>
            ) : null}
          </div>
          {createConfig && isCreateOpen ? (
            <div id="create-record" className="mt-5 animate-[fadeIn_0.3s_ease-out]">
              <CreateRecordForm config={createConfig} onSuccess={() => setIsCreateOpen(false)} />
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
              className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/50 transition hover:shadow-md hover:scale-[1.01]"
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
          <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-black">{title} Records</h3>
              <form action={activeHref} className="flex flex-col gap-2 sm:flex-row" method="get">
                <input
                  className="h-11 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20 sm:w-[280px]"
                  defaultValue={searchQuery}
                  name="q"
                  placeholder="Search records..."
                  type="search"
                />
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FAC54D] px-6 text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-md disabled:cursor-wait disabled:opacity-70"
                  type="submit"
                >
                  <Search className="size-4" />
                  Search
                </button>
              </form>
            </div>
            {searchQuery && (
              <div className="mb-4">
                <a href={activeHref} className="text-sm font-bold text-[#FAC54D] hover:underline">
                  Clear search for &quot;{searchQuery}&quot;
                </a>
              </div>
            )}
            {recordsTable}
          </article>

          <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
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
