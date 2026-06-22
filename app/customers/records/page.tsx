import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ErpShell } from "@/app/_components/erp-shell";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersRecordPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("deleted_customers_history")
    .select("*")
    .order("deleted_at", { ascending: false });

  return (
    <ErpShell activeHref="/customers/records" title="Deleted Customers History" user={user}>
      <div className="mb-8 rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Deleted Records</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">History of customers permanently removed from the system</p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-[16px] bg-red-50 text-red-500">
          <Trash2 className="size-6" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#d2d2d2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#d2d2d2] bg-[#fbfbfb]">
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Customer</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Contact Details</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Reason for Deletion</th>
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#343434]">Deleted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d2d2d2]">
              {(!records || records.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-gray-500">
                    No deleted customers found.
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
                      <div className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700 mb-1">
                        {record.reason}
                      </div>
                      {record.notes ? (
                        <p className="text-xs text-gray-600 truncate mt-1" title={record.notes}>
                          "{record.notes}"
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">
                        {new Date(record.deleted_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(record.deleted_at).toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}
                      </div>
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
