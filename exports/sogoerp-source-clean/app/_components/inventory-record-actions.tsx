"use client";

import { CheckCircle2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";

type InventoryRecordActionsProps = {
  custodyStatus: string;
  hasMic: boolean;
  id: string;
  imei: string;
  purchaseCost: string;
  status: string;
  technicianId: string;
};

type TechnicianOption = {
  active: boolean;
  cities: string;
  deviceCount: number;
  id: string;
  name: string;
};

const custodyOptions = ["company_hands", "on_the_way", "received_by_technician", "customer_hands", "returned"];

export function InventoryRecordActions({
  custodyStatus,
  hasMic,
  id,
  imei,
  purchaseCost,
  status,
  technicianId,
}: InventoryRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [draftImei, setDraftImei] = useState(imei);
  const [draftStatus, setDraftStatus] = useState(status === "-" ? "" : status);
  const [draftCustody, setDraftCustody] = useState(custodyStatus);
  const [draftHasMic, setDraftHasMic] = useState(hasMic);
  const [draftPurchaseCost, setDraftPurchaseCost] = useState(purchaseCost);
  const [draftTechnicianId, setDraftTechnicianId] = useState(technicianId || "");

  useEffect(() => {
    let ignore = false;

    async function loadTechnicians() {
      const response = await fetch("/api/erp/options/technicians", { cache: "no-store" });
      const payload = (await response.json()) as {
        error?: string;
        technicians?: TechnicianOption[];
      };

      if (!ignore && response.ok) {
        setTechnicians(payload.technicians ?? []);
      }
    }

    loadTechnicians();

    return () => {
      ignore = true;
    };
  }, []);

  async function saveRecord() {
    setError("");

    if ((draftCustody === "received_by_technician" || draftCustody === "on_the_way") && !draftTechnicianId) {
      alert("Please select which technician received (or is receiving) this device.");
      setError("Please select which technician received this device.");
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "inventory",
        values: {
          custody_status: draftCustody,
          has_mic: draftHasMic,
          imei: draftImei,
          purchase_cost: draftPurchaseCost,
          status: draftStatus,
          technician_id: draftTechnicianId,
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update this device.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function deleteRecord() {
    const shouldDelete = window.confirm(`Delete device ${imei}?`);

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

  const busy = isSaving || isDeleting;

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 py-2 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            setError("");
            setIsEditing((open) => !open);
          }}
          type="button"
        >
          {isEditing ? <X className="size-3" /> : <Pencil className="size-3" />}
          {isEditing ? "Close" : "Edit"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-black px-3 py-2 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={deleteRecord}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : <Trash2 className="size-3" />}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>

      {isEditing ? (
        <div className="w-[280px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-black">
              IMEI
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setDraftImei(event.target.value)}
                value={draftImei}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Device Status
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setDraftStatus(event.target.value)}
                placeholder="clear, disputed, faulty..."
                value={draftStatus}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Custody
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => {
                  const newCustody = event.target.value;
                  setDraftCustody(newCustody);
                  
                  const custodyToStatusMap: Record<string, string> = {
                    company_hands: "clear",
                    on_the_way: "assigned",
                    received_by_technician: "assigned",
                    customer_hands: "installed",
                    returned: "returned",
                  };
                  if (custodyToStatusMap[newCustody]) {
                    setDraftStatus(custodyToStatusMap[newCustody]);
                  }

                  if (newCustody !== "received_by_technician" && newCustody !== "on_the_way") {
                    setDraftTechnicianId("");
                  }
                }}
                value={draftCustody}
              >
                {custodyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-black">
              Received By Technician
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => {
                  const newTechId = event.target.value;
                  setDraftTechnicianId(newTechId);

                  if (newTechId) {
                    if (draftCustody !== "on_the_way") {
                      setDraftCustody("received_by_technician");
                      setDraftStatus("assigned");
                    }
                  } else {
                    if (draftCustody === "received_by_technician" || draftCustody === "on_the_way") {
                      setDraftCustody("company_hands");
                      setDraftStatus("clear");
                    }
                  }
                }}
                value={draftTechnicianId}
              >
                <option value="">No technician selected</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} / {technician.cities || "No city"} / {technician.deviceCount} devices
                    {!technician.active ? " / blocked" : ""}
                  </option>
                ))}
              </select>
              {!technicians.length ? (
                <span className="mt-1 block text-[11px] font-semibold text-red-600">
                  No technicians loaded. Add or unblock a technician first.
                </span>
              ) : null}
            </label>
            <label className="text-xs font-bold text-black">
              Purchase Cost
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setDraftPurchaseCost(event.target.value)}
                step="0.01"
                type="number"
                value={draftPurchaseCost}
              />
            </label>
            <label className="flex h-9 items-center gap-2 rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-bold text-black">
              <input
                checked={draftHasMic}
                className="size-4 accent-black"
                onChange={(event) => setDraftHasMic(event.target.checked)}
                type="checkbox"
              />
              With Mic
            </label>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
              disabled={busy}
              onClick={saveRecord}
              type="button"
            >
              {isSaving ? <LoadingSpinner className="size-3" /> : null}
              {isSaving ? "Saving" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[240px] text-xs font-semibold text-red-600">{error}</p> : null}
      {successMessage ? <p className="max-w-[260px] text-xs font-semibold text-green-700">{successMessage}</p> : null}
    </div>
  );
}
