import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

import { ViewDetailsModal } from "./view-details-modal";
import { getErpUserContext } from "@/lib/erp-context";
import { DeleteHistoryRecordButton } from "./delete-history-button";

export default async function CustomersRecordPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const context = await getErpUserContext(supabase);
  const isAdmin = context.role === "admin";

  const { data: records } = await supabase
    .from("customer_records_history")
    .select("*")
    .order("deleted_at", { ascending: false });

  return (
    <ErpShell activeHref="/customers/records" title="Customer Records History" user={user}>
      <div className="mb-8 rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Recent Customers</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">History of customer records and their final statuses</p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-[16px] bg-blue-50 text-blue-500">
          <History className="size-6" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#d2d2d2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#d2d2d2] bg-[#fbfbfb]">
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Customer</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Contact Details</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Reason</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Status</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Recorded At</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d2d2d2]">
              {(!records || records.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-gray-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{record.customer_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">ID: {String(record.customer_id).slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{record.phone}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{record.location}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        {record.reason}
                      </div>
                      {record.notes ? (
                        <p className="text-xs text-gray-600 truncate mt-1" title={record.notes}>
                          "{record.notes}"
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === "success" ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">Success</span>
                      ) : record.status === "failed" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">Failed</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-bold text-gray-700 ring-1 ring-inset ring-gray-600/20">Deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">
                        {new Date(record.deleted_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(record.deleted_at).toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <ViewDetailsModal record={{
                        customer_name: record.customer_name ?? "",
                        customer_id: record.customer_id ?? "",
                        phone: record.phone ?? "",
                        location: record.location ?? "",
                        reason: record.reason ?? "",
                        notes: record.notes ?? "",
                        status: record.status ?? "",
                        deleted_at: record.deleted_at ?? "",
                      }} />
                      {isAdmin ? (
                        <DeleteHistoryRecordButton id={record.id} />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ErpShell>
  );
}
