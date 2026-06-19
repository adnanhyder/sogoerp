"use client";

type Device = {
  id: string;
  imei: string;
  device_condition: string;
  purchase_cost: number | null;
  has_mic: boolean;
  created_at: string;
};

type InStockTableProps = {
  devices: Device[];
};

export function InStockTable({ devices }: InStockTableProps) {
  // Helper function for condition tag styling
  const conditionChipClass = (cond: string) => {
    const normalized = (cond || "new").toLowerCase();
    if (normalized === "new") return "border-green-200 bg-green-50 text-green-700";
    if (normalized === "refurbished") return "border-blue-200 bg-blue-50 text-blue-700";
    if (normalized === "used") return "border-yellow-200 bg-yellow-50 text-yellow-700";
    return "border-red-200 bg-red-50 text-red-700";
  };

  return (
    <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
      <table className="w-full border-collapse text-left text-sm min-w-[750px]">
        <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Device Condition</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Purchase Cost</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">With Mic?</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Date Added</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {devices.length ? (
            devices.map((device) => {
              const condition = device.device_condition || "new";

              return (
                <tr
                  className="border-t border-gray-100 transition hover:bg-[#fbfbfb]/80"
                  key={device.id}
                >
                  <td className="px-6 py-4.5 align-middle font-bold text-black tracking-[-0.01em]">
                    {device.imei}
                  </td>
                  <td className="px-6 py-4.5 align-middle">
                    <span
                      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${conditionChipClass(
                        condition
                      )}`}
                    >
                      {condition}
                    </span>
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
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#777777]">
                No in-stock devices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
