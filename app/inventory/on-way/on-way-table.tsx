"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

type Device = {
  id: string;
  imei: string;
  consignment_number: string | null;
  courier_company: string | null;
  created_at: string;
  technician_id: string | null;
  technicians: { name: string } | { name: string }[] | null;
};

type OnWayTableProps = {
  initialDevices: Device[];
};

export function OnWayTable({ initialDevices }: OnWayTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleMarkReceived = async (id: string) => {
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
            custody_status: "received_by_technician",
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to mark device as received.");
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
        <table className="w-full border-collapse text-left text-sm min-w-[950px]">
          <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Consignment Number</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Courier Company</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Assigned Technician</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Date Dispatched</th>
              <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-right w-[180px]">Actions</th>
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
                      {device.consignment_number ? (
                        <span className="font-bold text-black font-mono tracking-tight bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs">
                          {device.consignment_number}
                        </span>
                      ) : (
                        <span className="text-[#777777]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 align-middle font-bold text-black">
                      {device.courier_company || <span className="text-[#777777] font-medium">—</span>}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d2] bg-white px-2.5 py-0.5 text-xs font-bold text-black">
                        👷 {(() => {
                          const techObj = Array.isArray(device.technicians)
                            ? device.technicians[0]
                            : device.technicians;
                          return techObj?.name || "Unassigned";
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle text-xs font-semibold text-[#777777]">
                      {new Date(device.created_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4.5 align-middle text-right">
                      <div className="flex justify-end items-center gap-3">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                            <CheckCircle className="size-4" /> Received
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkReceived(device.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center rounded-[8px] bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-black/80 disabled:bg-gray-400"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="mr-1.5 size-3 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Mark Received"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm font-semibold text-[#777777]">
                  No devices currently on the way.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
