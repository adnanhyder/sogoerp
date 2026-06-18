"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Device = {
  id: string;
  imei: string;
  device_condition: string;
  purchase_cost: number | null;
  has_mic: boolean;
  created_at: string;
};

type InStockTableProps = {
  initialDevices: Device[];
};

export function InStockTable({ initialDevices }: InStockTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleConditionChange = async (id: string, newCondition: string) => {
    setUpdatingId(id);
    setErrorText(null);
    setSuccessId(null);

    try {
      const response = await fetch("/api/erp/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          moduleKey: "inventory",
          values: {
            device_condition: newCondition,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update device condition.");
      }

      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
      router.refresh();
    } catch (err: any) {
      setErrorText(err.message || "An unexpected error occurred.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorText && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorText}
        </div>
      )}

      <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
        <table className="w-full border-collapse text-left text-sm min-w-[800px]">
          <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Device Condition</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Purchase Cost</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">With Mic?</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Date Added</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a] w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialDevices.length ? (
              initialDevices.map((device) => {
                const isUpdating = updatingId === device.id;
                const isSuccess = successId === device.id;

                return (
                  <tr
                    className="border-t border-gray-100 transition hover:bg-[#fbfbfb]/80"
                    key={device.id}
                  >
                    <td className="px-6 py-4.5 align-middle font-bold text-black tracking-[-0.01em]">
                      {device.imei}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <div className="flex items-center gap-3">
                        <select
                          value={device.device_condition || "new"}
                          disabled={isUpdating}
                          onChange={(e) => handleConditionChange(device.id, e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none transition focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="new">New</option>
                          <option value="refurbished">Refurbished</option>
                          <option value="used">Used</option>
                          <option value="faulty">Faulty</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 align-middle font-bold text-black tabular-nums">
                      Rs. {device.purchase_cost?.toLocaleString() ?? "0"}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span
                        className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold ${
                          device.has_mic
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-[#d2d2d2] bg-[#fbfbfb] text-[#777777]"
                        }`}
                      >
                        {device.has_mic ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle text-xs font-semibold text-[#777777]">
                      {new Date(device.created_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      {isUpdating && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                          <Loader2 className="size-3.5 animate-spin" /> Saving...
                        </span>
                      )}
                      {isSuccess && (
                        <span className="text-xs font-bold text-green-600 animate-fade-in">
                          ✓ Saved
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm font-semibold text-[#777777]">
                  No in-stock devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
