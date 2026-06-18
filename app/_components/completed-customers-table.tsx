"use client";

import { useState } from "react";
import { X, Search, UserCheck, ShieldAlert, Award } from "lucide-react";

type CompletedCustomersTableProps = {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
};

export function CompletedCustomersTable({ columns, rows }: CompletedCustomersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<readonly string[] | null>(null);

  if (!rows.length) return null;

  const filteredRows = rows.filter((row) => {
    const term = searchQuery.toLowerCase();
    const custName = row[1]?.toLowerCase() ?? "";
    const phone = row[2]?.toLowerCase() ?? "";
    const city = row[7]?.toLowerCase() ?? "";
    const imei = row[16]?.toLowerCase() ?? "";
    const techName = row[19]?.toLowerCase() ?? "";
    return custName.includes(term) || phone.includes(term) || city.includes(term) || imei.includes(term) || techName.includes(term);
  });

  // Display columns: Customer, Phone, Location, Vehicle, Budget, Assigned Device, Technician, Installed At
  // Note: we can map the display columns directly or define them specifically for completed customers
  return (
    <div className="mt-8 rounded-[16px] bg-white shadow-sm ring-1 ring-[#eeeeee] overflow-hidden">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-black flex items-center gap-2">
            <UserCheck className="size-5 text-green-600" />
            Successfully Installed Customers
          </h2>
          <p className="mt-1 text-sm font-medium text-[#7a7a7a]">
            Active accounts with successfully installed tracking devices.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search completed customers..."
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

      {/* Table Content */}
      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="size-10 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">No completed customers found</p>
          <p className="text-xs text-gray-400 mt-1">Try refining your search term.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
          <table className="w-full text-left text-sm border-collapse min-w-[1250px]">
            <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Customer</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Phone</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Location/City</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Vehicle</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Assigned Device</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Technician</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Installed On</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row[0]} className="hover:bg-[#fbfbfb]/80 transition-colors">
                  <td className="px-6 py-4.5">
                    <span className="font-bold text-black">{row[1]}</span>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-gray-600">{row[2]}</td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-gray-500">{row[7]}</td>
                  <td className="px-6 py-4.5">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-[6px] border border-gray-100 inline-block">
                      {row[8]}
                    </span>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="text-xs font-bold text-black tabular-nums">{row[16]}</span>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-gray-600">
                    👷 {row[19] || "Unassigned"}
                  </td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-gray-500">
                    {row[20] || "—"}
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(row)}
                      className="inline-flex items-center gap-1 rounded-[6px] bg-green-50 border border-green-200 px-2.5 py-1.5 text-[10px] font-bold text-green-700 hover:bg-green-100 transition-colors shadow-sm"
                    >
                      <Search className="size-3" />
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox / Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[20px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#eeeeee] bg-[#fbfbfb] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Award className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Customer Installation Report</h3>
                  <p className="text-xs font-medium text-[#7a7a7a]">Customer ID: {selectedCustomer[0]}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full p-2 text-[#7a7a7a] transition hover:bg-[#eeeeee] hover:text-black"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Customer Name", value: selectedCustomer[1] },
                  { label: "Phone Number", value: selectedCustomer[2] },
                  { label: "WhatsApp", value: selectedCustomer[3] || "—" },
                  { label: "Address Details", value: `${selectedCustomer[5] || ""} ${selectedCustomer[6] || ""}`.trim() || "—" },
                  { label: "City", value: selectedCustomer[7] },
                  { label: "Vehicle Type", value: selectedCustomer[8] },
                  { label: "Assigned Device IMEI", value: selectedCustomer[16] },
                  { label: "Technician", value: selectedCustomer[19] || "—" },
                  { label: "Total Cost (Budget)", value: `Rs. ${Number(selectedCustomer[9] || 0).toLocaleString()}` },
                  { label: "Installation Date & Time", value: selectedCustomer[20] },
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
                onClick={() => setSelectedCustomer(null)}
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
