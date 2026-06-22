"use client";

import { CheckCircle2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";
import { AlertModal } from "./alert-modal";

type InventoryRecordActionsProps = {
  custodyStatus: string;
  hasMic: boolean;
  id: string;
  imei: string;
  purchaseCost: string;
  status: string;
  technicianId: string;
  consignmentNumber?: string;
  courierCompany?: string;
  sentByTechnicianId?: string;
  dispatchedAt?: string;
  receivedAt?: string;
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
  consignmentNumber = "",
  courierCompany = "",
  sentByTechnicianId = "",
  dispatchedAt = "",
  receivedAt = "",
}: InventoryRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
  const [draftConsignmentNumber, setDraftConsignmentNumber] = useState(consignmentNumber);
  const [draftCourierCompany, setDraftCourierCompany] = useState(courierCompany);
  const [draftSentByTechnicianId, setDraftSentByTechnicianId] = useState(sentByTechnicianId || "");
  const [draftDispatchedAt, setDraftDispatchedAt] = useState(dispatchedAt ? dispatchedAt.slice(0, 16) : "");
  const [draftReceivedAt, setDraftReceivedAt] = useState(receivedAt ? receivedAt.slice(0, 16) : "");

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
      setError("Please select which technician received this device.");
      return;
    }

    if (draftCustody === "on_the_way" && (!draftConsignmentNumber.trim() || !draftCourierCompany.trim() || !draftDispatchedAt.trim())) {
      setError("Please specify consignment number, courier company, and departure date/time.");
      return;
    }

    if (draftCustody === "received_by_technician" && !draftReceivedAt.trim()) {
      setError("Please specify the date and time the device was received.");
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
          technician_id: draftCustody === "company_hands" ? null : draftTechnicianId || null,
          sent_by_technician_id: draftSentByTechnicianId || null,
          consignment_number: draftConsignmentNumber || null,
          courier_company: draftCourierCompany || null,
          dispatched_at: draftDispatchedAt ? new Date(draftDispatchedAt).toISOString() : null,
          received_at: draftReceivedAt ? new Date(draftReceivedAt).toISOString() : null,
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
            if (!isEditing) {
              setDraftImei(imei);
              setDraftStatus(status === "-" ? "" : status);
              setDraftCustody(custodyStatus);
              setDraftHasMic(hasMic);
              setDraftPurchaseCost(purchaseCost);
              setDraftTechnicianId(technicianId || "");
              setDraftConsignmentNumber(consignmentNumber || "");
              setDraftCourierCompany(courierCompany || "");
              setDraftSentByTechnicianId(sentByTechnicianId || "");
              setDraftDispatchedAt(dispatchedAt ? dispatchedAt.slice(0, 16) : "");
              setDraftReceivedAt(receivedAt ? receivedAt.slice(0, 16) : "");
            }
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
          onClick={() => setIsDeleteModalOpen(true)}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : <Trash2 className="size-3" />}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Inventory Device</h3>
                <p className="text-sm text-gray-500 font-medium">Device: {imei}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">IMEI</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setDraftImei(event.target.value)}
                  value={draftImei}
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Device Status</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setDraftStatus(event.target.value)}
                  placeholder="clear, disputed, faulty..."
                  value={draftStatus}
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Custody</span>
                <select
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
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
              
              {/* Transfer Section — always visible to allow re-assignment */}
              <div className="sm:col-span-2 rounded-[14px] border-2 border-[#FAC54D]/40 bg-[#FAC54D]/5 p-4">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-[#b58b29]">📦 Device Transfer / Assignment</p>
                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Sent By (the technician dispatching the device) */}
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Sent By (Technician)</span>
                    <select
                      className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                      onChange={(event) => setDraftSentByTechnicianId(event.target.value)}
                      value={draftSentByTechnicianId}
                    >
                      <option value="">Company / No technician</option>
                      {technicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>
                          {technician.name} / {technician.cities || "No city"}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Received By (the technician receiving the device) */}
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Received By (Technician)</span>
                    <select
                      className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                      onChange={(event) => {
                        const newTechId = event.target.value;
                        setDraftTechnicianId(newTechId);
                        if (newTechId && draftCustody === "company_hands") {
                          setDraftCustody("on_the_way");
                          setDraftStatus("assigned");
                        }
                        if (!newTechId) {
                          setDraftSentByTechnicianId("");
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

                  {/* Courier info — always shown so data isn't lost, but only required when on_the_way */}
                  <div className="space-y-4 pt-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Courier Company {draftCustody === "on_the_way" && <span className="text-red-500">*</span>}</span>
                      <input
                        className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        onChange={(event) => setDraftCourierCompany(event.target.value)}
                        placeholder="e.g. TCS, Leopard, Trax"
                        value={draftCourierCompany}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Consignment Number {draftCustody === "on_the_way" && <span className="text-red-500">*</span>}</span>
                      <input
                        className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        onChange={(event) => setDraftConsignmentNumber(event.target.value)}
                        placeholder="Consignment No..."
                        value={draftConsignmentNumber}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Departure Date & Time {draftCustody === "on_the_way" && <span className="text-red-500">*</span>}</span>
                      <DateTimePicker
                        className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        name="dispatched_at"
                        onChange={(e) => setDraftDispatchedAt(e.target.value)}
                        required={draftCustody === "on_the_way"}
                        value={draftDispatchedAt}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Received Date & Time {draftCustody === "received_by_technician" && <span className="text-red-500">*</span>}</span>
                      <DateTimePicker
                        className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        name="received_at"
                        onChange={(e) => setDraftReceivedAt(e.target.value)}
                        required={draftCustody === "received_by_technician"}
                        value={draftReceivedAt}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Purchase Cost</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setDraftPurchaseCost(event.target.value)}
                  step="0.01"
                  type="number"
                  value={draftPurchaseCost}
                />
              </label>
              
              <label className="flex h-12 items-center gap-3 rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  checked={draftHasMic}
                  className="size-5 accent-[#FAC54D] rounded text-[#FAC54D] focus:ring-[#FAC54D]"
                  onChange={(event) => setDraftHasMic(event.target.checked)}
                  type="checkbox"
                />
                With Mic
              </label>
            </div>
            
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                ⚠️ {error}
              </div>
            )}
            
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                className="inline-flex h-12 items-center justify-center rounded-[12px] border-2 border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 focus:border-gray-300 focus:ring-4 focus:ring-gray-200/50 disabled:opacity-50"
                onClick={() => setIsEditing(false)}
                type="button"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={busy}
                onClick={saveRecord}
                type="button"
              >
                {isSaving ? <LoadingSpinner className="size-4" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
      {successMessage ? <p className="max-w-[260px] text-xs font-semibold text-green-700">{successMessage}</p> : null}

      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          deleteRecord();
        }}
        title="Delete Device"
        description={`Are you sure you want to permanently delete device ${imei}?`}
        confirmText="Delete"
        type="delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
