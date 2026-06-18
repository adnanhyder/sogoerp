"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Search, X, Receipt } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";

type PaidCommission = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  receipt_url?: string;
  technicians?: {
    name: string;
  } | null;
};

export function PaidCommissionsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commissions, setCommissions] = useState<PaidCommission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  async function fetchPaidCommissions() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/erp/technicians/paid", { cache: "no-store" });
      const payload = (await res.json()) as { paid?: PaidCommission[]; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to fetch paid records");
      setCommissions(payload.paid ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPaidCommissions();

    // Listen for custom event when payment is successfully made
    const handlePaymentSettled = () => {
      fetchPaidCommissions();
    };

    window.addEventListener("payment-settled", handlePaymentSettled);
    return () => {
      window.removeEventListener("payment-settled", handlePaymentSettled);
    };
  }, []);

  const filteredCommissions = commissions.filter((c) => {
    const term = searchQuery.toLowerCase();
    const techName = c.technicians?.name?.toLowerCase() ?? "";
    const reason = c.reason?.toLowerCase() ?? "";
    return techName.includes(term) || reason.includes(term);
  });

  const totalPaid = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="mt-8 rounded-[16px] bg-white shadow-sm ring-1 ring-[#eeeeee] overflow-hidden">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 border-b border-[#eeeeee] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-black flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            Paid Commissions & Slips Record
          </h2>
          <p className="mt-1 text-sm font-medium text-[#7a7a7a]">
            History of all settled commission payments and uploaded bank/cash receipts.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Filter by technician or reason..."
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LoadingSpinner className="size-8 text-green-500 mb-2" />
          <p className="text-xs font-semibold text-gray-500">Loading payment records...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-sm font-semibold text-red-600 bg-red-50/50">
          Failed to load records: {error}
        </div>
      ) : filteredCommissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Banknote className="size-10 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">No paid records found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery ? "Try refining your filter term." : "Commissions marked as paid will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a] w-16">#</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Technician</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Reason</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a]">Payment Date</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-right">Amount</th>
                <th className="px-6 py-4 font-extrabold text-[#7a7a7a] text-center w-32">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommissions.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#fbfbfb]/80 transition-colors">
                  <td className="px-6 py-4.5 text-xs font-bold text-gray-400">{idx + 1}</td>
                  <td className="px-6 py-4.5">
                    <span className="font-bold text-black">{c.technicians?.name ?? "Unknown Tech"}</span>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-[6px] border border-gray-100 inline-block">
                      {c.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-xs font-semibold text-gray-500">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <span className="font-black text-green-700 tabular-nums">Rs. {c.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    {c.receipt_url ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(c.receipt_url ?? null)}
                        className="inline-flex items-center gap-1 rounded-[6px] bg-green-50 border border-green-200 px-2.5 py-1.5 text-[10px] font-bold text-green-700 hover:bg-green-100 transition-colors shadow-sm"
                      >
                        <Receipt className="size-3" />
                        View Slip
                      </button>
                    ) : (
                      <span className="text-gray-300 text-[10px] font-semibold italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#fbfbfb] border-t border-gray-100">
                <td colSpan={4} className="px-6 py-4.5 text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Total Paid Volume
                </td>
                <td className="px-6 py-4.5 text-right">
                  <span className="font-black text-green-800 text-sm tabular-nums">Rs. {totalPaid.toLocaleString()}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Lightbox for Receipt Image */}
      {selectedReceiptUrl && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedReceiptUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedReceiptUrl(null)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <X className="size-4 text-gray-700" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedReceiptUrl}
              alt="Commission Payment Receipt"
              className="max-w-full max-h-[85vh] rounded-[16px] shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
