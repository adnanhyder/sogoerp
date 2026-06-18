"use client";

import { useState } from "react";
import { X, Search, Smartphone } from "lucide-react";

type InstalledDevicesTableProps = {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
};

function inventoryChipClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("company")) return "border-[#d2d2d2] bg-white text-black";
  if (normalized.includes("way")) return "border-black bg-black text-white";
  if (normalized.includes("technician")) return "border-[#343434] bg-[#343434] text-white";
  if (normalized.includes("clear")) return "border-green-200 bg-green-50 text-green-700";
  if (normalized.includes("disputed") || normalized.includes("fault") || normalized.includes("issue")) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-[#d2d2d2] bg-[#fbfbfb] text-[#343434]";
}

function renderInventoryCell(cell: string, index: number) {
  if (index === 0) return <span className="font-bold tracking-[-0.01em] text-black">{cell}</span>;
  if (index === 1 || index === 2) {
    return (
      <span className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${inventoryChipClass(cell)}`}>
        {cell}
      </span>
    );
  }
  return cell;
}

export function InstalledDevicesTable({ columns, rows }: InstalledDevicesTableProps) {
  const [selectedDevice, setSelectedDevice] = useState<readonly string[] | null>(null);

  if (!rows.length) return null;

  return (
    <div className="mt-12 rounded-[16px] bg-white shadow-sm ring-1 ring-[#eeeeee]">
      <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-black">Successfully Installed Devices</h2>
          <p className="mt-1 text-sm font-medium text-[#7a7a7a]">
            These devices have been successfully installed and are now active in the field.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fbfbfb]">
            <tr>
              {columns.slice(4).map((col, i) => (
                <th
                  className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7a7a7a]"
                  key={col}
                >
                  {col}
                </th>
              ))}
              <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7a7a7a]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const visibleCells = row.slice(4);
              return (
                <tr className="border-t border-[#eeeeee] transition hover:bg-[#fbfbfb]" key={row[0]}>
                  {visibleCells.map((cell, index) => (
                    <td
                      className={`px-4 py-4 align-middle text-[#343434]`}
                      key={`${cell}-${index}`}
                    >
                      {renderInventoryCell(cell, index)}
                    </td>
                  ))}
                  <td className="px-4 py-4 align-middle">
                    <button
                      onClick={() => setSelectedDevice(row)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-xs font-bold text-black transition hover:border-black"
                    >
                      <Search className="size-3" />
                      View Record
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[20px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#eeeeee] bg-[#fbfbfb] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Installed Device Details</h3>
                  <p className="text-xs font-medium text-[#7a7a7a]">IMEI: {selectedDevice[4]}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="rounded-full p-2 text-[#7a7a7a] transition hover:bg-[#eeeeee] hover:text-black"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Inventory ID", value: selectedDevice[0] },
                  { label: "Status", value: selectedDevice[1] },
                  { label: "Custody", value: selectedDevice[2] },
                  { label: "Technician", value: selectedDevice[3] || "N/A" },
                  { label: "IMEI", value: selectedDevice[4] },
                  { label: "Network", value: selectedDevice[5] },
                  { label: "Phone Number", value: selectedDevice[6] },
                  { label: "Has Mic", value: selectedDevice[7] },
                  { label: "ICCID", value: selectedDevice[8] },
                  { label: "Device Brand", value: selectedDevice[9] },
                  { label: "Sim Network", value: selectedDevice[10] },
                  { label: "Purchase Cost", value: `Rs. ${selectedDevice[11]}` },
                  { label: "Added On", value: selectedDevice[12] },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 rounded-lg bg-[#fbfbfb] p-3 border border-[#eeeeee]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a7a]">{item.label}</span>
                    <span className="text-sm font-bold text-[#343434]">{item.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-[#eeeeee] bg-[#fbfbfb] px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedDevice(null)}
                className="inline-flex h-10 items-center justify-center rounded-[8px] bg-black px-6 text-sm font-bold text-white transition hover:bg-[#343434]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
