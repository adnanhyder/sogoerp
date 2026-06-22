"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

interface RecordDetails {
  customer_name: string;
  customer_id: string;
  phone: string;
  location: string;
  reason: string;
  notes: string;
  status: string;
  deleted_at: string;
}

export function ViewDetailsModal({ record }: { record: RecordDetails }) {
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
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Record Details</h3>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</div>
                  <div className="mt-1 font-semibold text-gray-900">{record.customer_name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
                  <div className="mt-1">
                    {record.status === "success" ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">Success</span>
                    ) : record.status === "failed" ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">Failed</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-bold text-gray-700 ring-1 ring-inset ring-gray-600/20">Deleted</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</div>
                  <div className="mt-1 text-sm text-gray-700">{record.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</div>
                  <div className="mt-1 text-sm text-gray-700">{record.location || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded At</div>
                  <div className="mt-1 text-sm text-gray-700">
                    {new Date(record.deleted_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</div>
                  <div className="mt-1 text-sm text-gray-700">{record.customer_id}</div>
                </div>
                
                <div className="col-span-2 pt-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider border-t border-gray-100 pt-4">Reason</div>
                  <div className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    {record.reason}
                  </div>
                </div>
                
                {record.notes ? (
                  <div className="col-span-2 pt-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</div>
                    <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
                      {record.notes}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-end">
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
