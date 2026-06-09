"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

type InventoryRecordActionsProps = {
  id: string;
  status: string;
};

export function InventoryRecordActions({ id, status }: InventoryRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  if (status !== "purchased") {
    return <span className="text-xs font-semibold text-[#777777]">No actions</span>;
  }

  async function markDraft() {
    setError("");
    setIsDrafting(true);

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "inventory",
        values: { status: "draft" },
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    setIsDrafting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to mark this device as draft.");
      return;
    }

    router.refresh();
  }

  async function deleteRecord() {
    const shouldDelete = window.confirm("Delete this purchased inventory record?");

    if (!shouldDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({
        id,
        moduleKey: "inventory",
      }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: string };

    setIsDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to delete this device.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-[168px] flex-col gap-2">
      <div className="flex gap-2">
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 py-2 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-50"
          disabled={isDrafting || isDeleting}
          onClick={markDraft}
          type="button"
        >
          {isDrafting ? <LoadingSpinner className="size-3" /> : null}
          {isDrafting ? "Processing" : "Draft"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-black px-3 py-2 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-50"
          disabled={isDrafting || isDeleting}
          onClick={deleteRecord}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : null}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>
      {error ? <p className="max-w-[180px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
