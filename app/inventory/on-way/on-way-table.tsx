"use client";

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
  devices: Device[];
};

export function OnWayTable({ devices }: OnWayTableProps) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
      <table className="w-full border-collapse text-left text-sm min-w-[850px]">
        <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">IMEI</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Consignment Number</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Courier Company</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Assigned Technician</th>
            <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Date Dispatched</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {devices.length ? (
            devices.map((device) => {
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
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#777777]">
                No devices currently on the way.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
