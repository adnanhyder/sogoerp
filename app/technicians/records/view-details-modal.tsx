"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

interface ActivityDetails {
  type: string;
  date: string;
  techName: string;
  description: string;
  raw: any;
}

export function ViewDetailsModal({ activity }: { activity: ActivityDetails }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="size-3.5" />
        View Details
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activity.type === 'work_order' ? '🛠️ Work Order Details' : '📦 Transfer Details'}
              </h3>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</div>
                  <div className="mt-1 font-semibold text-gray-900">{activity.techName}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${activity.type === 'work_order' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {activity.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</div>
                  <div className="mt-1 text-sm text-gray-800 font-medium">{activity.description}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</div>
                  <div className="mt-1 text-sm text-gray-700">
                    {new Date(activity.date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
                  <div className="mt-1 text-sm text-gray-700 font-medium uppercase">{activity.raw?.status || "-"}</div>
                </div>

                <div className="col-span-2 border-b border-gray-100 mt-2 mb-1"></div>

                {activity.type === "work_order" && (
                  <>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.customers?.full_name || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.customers?.location || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled At</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.scheduled_at ? new Date(activity.raw.scheduled_at).toLocaleString() : "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.completed_at ? new Date(activity.raw.completed_at).toLocaleString() : "-"}</div>
                    </div>
                  </>
                )}

                {activity.type === "transfer" && (
                  <>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Device IMEI</div>
                      <div className="mt-1 text-sm text-gray-700 font-mono">{activity.raw?.devices?.imei || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Route</div>
                      <div className="mt-1 text-sm text-gray-700">
                        {activity.raw?.technicians?.name || "Company"} &rarr; {activity.raw?.toTech?.name || "Customer"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Departed At</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.departed_at ? new Date(activity.raw.departed_at).toLocaleString() : "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</div>
                      <div className="mt-1 text-sm text-gray-700">{activity.raw?.received_at ? new Date(activity.raw.received_at).toLocaleString() : "-"}</div>
                    </div>
                  </>
                )}
                
                <div className="col-span-2 pt-1">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Record ID</div>
                  <div className="mt-1 text-xs text-gray-500 font-mono">{activity.raw?.id || "-"}</div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-end shrink-0">
              <button
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
