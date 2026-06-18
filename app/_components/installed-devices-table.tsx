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
  return cell;
}

export function InstalledDevicesTable({ columns, rows }: InstalledDevicesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<{ row: readonly string[]; deviceNo: string } | null>(null);

  if (!rows.length) return null;

  const filteredRows = rows.filter((row) => {
    const term = searchQuery.toLowerCase();
    const imei = row[4]?.toLowerCase() ?? "";
    const techName = row[8]?.toLowerCase() ?? "";
    const custName = row[9]?.toLowerCase() ?? "";
    const city = row[10]?.toLowerCase() ?? "";
    return imei.includes(term) || techName.includes(term) || custName.includes(term) || city.includes(term);
  });

  return (
    <div className="mt-12 rounded-[16px] bg-white shadow-sm ring-1 ring-[#eeeeee]">
      <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-black">Successfully Installed Devices</h2>
          <p className="mt-1 text-sm font-medium text-[#7a7a7a]">
            These devices have been successfully installed and are now active in the field.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search installed devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-[8px] border border-gray-200 bg-[#fbfbfb] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#FAC54D] focus:bg-white focus:ring-2 focus:ring-[#FAC54D]/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
        <table className="w-full text-left text-sm border-collapse min-w-[1250px]">
          <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Device #</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Customer Name</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">City</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Technician</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Purchase Cost</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Sale Price</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Installation Date</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((row, idx) => {
              const deviceNo = String(rows.length - idx).padStart(2, "0");
              return (
                <tr className="hover:bg-[#fbfbfb]/80 transition-colors" key={row[0]}>
                  <td className="px-6 py-4.5 align-middle text-sm font-bold text-black">{deviceNo}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-bold text-gray-900">{row[9] !== "-" ? row[9] : "—"}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-semibold text-gray-500">{row[16] !== "-" ? row[16] : "—"}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-semibold text-gray-600">👷 {row[8] !== "-" ? row[8] : "—"}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-bold text-black tabular-nums">{row[4]}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-semibold text-green-700">Rs. {Number(row[12] || 0).toLocaleString()}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-semibold text-green-700">Rs. {Number(row[17] || 0).toLocaleString()}</td>
                  <td className="px-6 py-4.5 align-middle text-sm font-semibold text-gray-500">{row[18] !== "-" ? row[18] : "—"}</td>
                  <td className="px-6 py-4.5 align-middle text-center">
                    <button
                      onClick={() => setSelectedDevice({ row, deviceNo })}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-green-50 border border-green-200 px-3 text-[10px] font-bold text-green-700 transition hover:bg-green-100 shadow-sm"
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
                  <p className="text-xs font-medium text-[#7a7a7a]">IMEI: {selectedDevice.row[4]}</p>
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
                  { label: "Inventory ID", value: selectedDevice.deviceNo },
                  { label: "Status", value: selectedDevice.row[5] },
                  { label: "Custody", value: selectedDevice.row[6] },
                  {
                    label: "Technician",
                    value: selectedDevice.row[8] && selectedDevice.row[14] && selectedDevice.row[14] !== "-"
                      ? `${selectedDevice.row[8]} (${selectedDevice.row[14]})`
                      : selectedDevice.row[8] || "N/A"
                  },
                  { label: "IMEI", value: selectedDevice.row[4] },
                  { label: "Phone Number", value: selectedDevice.row[15] !== "-" ? selectedDevice.row[15] : "—" },
                  { label: "Has Mic", value: selectedDevice.row[7] },
                  { label: "Customer Name", value: selectedDevice.row[9] !== "-" ? selectedDevice.row[9] : "—" },
                  { label: "City", value: selectedDevice.row[16] !== "-" ? selectedDevice.row[16] : "—" },
                  { label: "Purchase Cost", value: `Rs. ${Number(selectedDevice.row[12] || 0).toLocaleString()}` },
                  { label: "Sale Price", value: `Rs. ${Number(selectedDevice.row[17] || 0).toLocaleString()}` },
                  { label: "Installation Date & Time", value: selectedDevice.row[18] !== "-" ? selectedDevice.row[18] : "—" },
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
