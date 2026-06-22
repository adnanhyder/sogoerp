import { requireUser } from "@/lib/auth";
import { ErpShell } from "@/app/_components/erp-shell";
import { PaidCommissionsTable } from "@/app/_components/paid-commissions-table";
import { Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechniciansPayrollPage() {
  const user = await requireUser();

  return (
    <ErpShell activeHref="/technicians/payroll" title="Paid Commissions" user={user}>
      <div className="mb-8 rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Paid Commissions</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">History of settled commission payments and uploaded bank/cash receipts.</p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-[16px] bg-green-50 text-green-600">
          <Banknote className="size-6" />
        </div>
      </div>

      <PaidCommissionsTable />
    </ErpShell>
  );
}
