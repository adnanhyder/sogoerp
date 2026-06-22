"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DeleteHistoryRecordButtonProps = {
  id: string;
};

export function DeleteHistoryRecordButton({ id }: DeleteHistoryRecordButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to permanently delete this customer history record? This will erase the customer completely and reset any installed devices back to company stock.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/erp/delete", {
        body: JSON.stringify({
          id,
          moduleKey: "customer_records_history",
        }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });

      const result = await response.json() as { error?: string };

      if (!response.ok || result.error) {
        alert(result.error ?? "Failed to delete customer history record.");
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
      title="Delete customer permanently"
      type="button"
    >
      <Trash2 className="size-3.5" />
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
