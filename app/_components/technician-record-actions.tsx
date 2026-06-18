"use client";

import { Ban, Pencil, ShieldAlert, Trash2, X, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { AlertModal } from "./alert-modal";

type UnpaidCommission = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

type TechnicianRecordActionsProps = {
  active: boolean;
  authorizationPersonCnic: string;
  authorizationPersonName: string;
  authorizationPersonPhone: string;
  authorizationRelation: string;
  cities: string;
  cnic: string;
  commissionRate: string;
  disputed: boolean;
  id: string;
  name: string;
  phone: string;
};

export function TechnicianRecordActions({
  active,
  authorizationPersonCnic,
  authorizationPersonName,
  authorizationPersonPhone,
  authorizationRelation,
  cities,
  cnic,
  commissionRate,
  disputed,
  id,
  name,
  phone,
}: TechnicianRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isFetchingUnpaid, setIsFetchingUnpaid] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [unpaidCommissions, setUnpaidCommissions] = useState<UnpaidCommission[]>([]);
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isTogglingDispute, setIsTogglingDispute] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftCnic, setDraftCnic] = useState(cnic === "-" ? "" : cnic);
  const [draftPhone, setDraftPhone] = useState(phone === "-" ? "" : phone);
  const [draftCities, setDraftCities] = useState(cities === "-" ? "" : cities);
  const [draftAuthorizationPersonName, setDraftAuthorizationPersonName] = useState(
    authorizationPersonName === "-" ? "" : authorizationPersonName,
  );
  const [draftAuthorizationPersonPhone, setDraftAuthorizationPersonPhone] = useState(
    authorizationPersonPhone === "-" ? "" : authorizationPersonPhone,
  );
  const [draftAuthorizationPersonCnic, setDraftAuthorizationPersonCnic] = useState(
    authorizationPersonCnic,
  );
  const [draftAuthorizationRelation, setDraftAuthorizationRelation] = useState(
    authorizationRelation,
  );
  const [draftCommissionRate, setDraftCommissionRate] = useState(commissionRate);
  const editFields: [string, string, Dispatch<SetStateAction<string>>, "number" | "text"][] = [
    ["Name", draftName, setDraftName, "text"],
    ["Technician CNIC", draftCnic, setDraftCnic, "text"],
    ["Phone", draftPhone, setDraftPhone, "text"],
    ["Cities", draftCities, setDraftCities, "text"],
    ["Authorization Person Name", draftAuthorizationPersonName, setDraftAuthorizationPersonName, "text"],
    ["Authorization Person Phone", draftAuthorizationPersonPhone, setDraftAuthorizationPersonPhone, "text"],
    ["Authorization Person CNIC", draftAuthorizationPersonCnic, setDraftAuthorizationPersonCnic, "text"],
    ["Relation", draftAuthorizationRelation, setDraftAuthorizationRelation, "text"],
    ["Commission Rate", draftCommissionRate, setDraftCommissionRate, "number"],
  ];

  async function updateTechnician(values: Record<string, unknown>) {
    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({ id, moduleKey: "technicians", values }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to update technician.");
    }
  }

  async function saveRecord() {
    setError("");
    setIsSaving(true);

    try {
      await updateTechnician({
        authorization_person_cnic: draftAuthorizationPersonCnic,
        authorization_person_name: draftAuthorizationPersonName,
        authorization_person_phone: draftAuthorizationPersonPhone,
        authorization_relation: draftAuthorizationRelation,
        cities: draftCities,
        cnic: draftCnic,
        commission_rate: draftCommissionRate,
        name: draftName,
        phone: draftPhone,
      });
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update technician.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleBlock() {
    setError("");
    setIsTogglingBlock(true);

    try {
      await updateTechnician({ active: !active });
      router.refresh();
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : "Unable to update block status.");
    } finally {
      setIsTogglingBlock(false);
    }
  }

  async function toggleDispute() {
    setError("");
    setIsTogglingDispute(true);

    try {
      await updateTechnician({ disputed: !disputed });
      router.refresh();
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Unable to update dispute status.");
    } finally {
      setIsTogglingDispute(false);
    }
  }

  async function openPaymentModal() {
    setIsPaying(true);
    setIsFetchingUnpaid(true);
    setError("");
    setSelectedCommissions(new Set());

    try {
      const res = await fetch(`/api/erp/technicians/unpaid?technicianId=${id}`);
      const payload = (await res.json()) as { unpaid?: UnpaidCommission[]; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to fetch unpaid commissions");
      setUnpaidCommissions(payload.unpaid ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching unpaid commissions");
    } finally {
      setIsFetchingUnpaid(false);
    }
  }

  function toggleCommissionSelection(commissionId: string) {
    const next = new Set(selectedCommissions);
    if (next.has(commissionId)) next.delete(commissionId);
    else next.add(commissionId);
    setSelectedCommissions(next);
  }

  async function submitPayment() {
    if (selectedCommissions.size === 0) return;
    setIsSubmittingPayment(true);
    setError("");

    try {
      const res = await fetch("/api/erp/technicians/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId: id,
          commissionIds: Array.from(selectedCommissions),
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to process payment");
      
      setIsPaying(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function deleteRecord() {
    setError("");
    setIsDeleting(true);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({ id, moduleKey: "technicians" }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: string };

    setIsDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to delete technician.");
      return;
    }

    router.refresh();
  }

  const busy = isSaving || isDeleting || isTogglingBlock || isTogglingDispute;

  return (
    <div className="flex min-w-[300px] flex-col gap-2">
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
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 py-2 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={toggleBlock}
          type="button"
        >
          {isTogglingBlock ? <LoadingSpinner className="size-3" /> : <Ban className="size-3" />}
          {active ? "Block" : "Unblock"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-500 disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={toggleDispute}
          type="button"
        >
          {isTogglingDispute ? <LoadingSpinner className="size-3" /> : <ShieldAlert className="size-3" />}
          {disputed ? "Clear" : "Dispute"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-500 disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={() => setIsDeleteModalOpen(true)}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : <Trash2 className="size-3" />}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-[#FAC54D] px-3 py-2 text-xs font-bold text-gray-900 transition hover:bg-[#e0b040] disabled:cursor-wait disabled:opacity-50 shadow-sm"
          disabled={busy}
          onClick={openPaymentModal}
          type="button"
        >
          <Banknote className="size-3" />
          Settle Payment
        </button>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[600px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Technician</h3>
                <p className="text-sm text-gray-500 font-medium">Technician: {name}</p>
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
              {editFields.map(([label, value, setter, type]) => (
                <label className="block" key={label}>
                  <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">{label}</span>
                  <input
                    className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                    onChange={(event) => setter(event.target.value)}
                    type={type}
                    value={value}
                  />
                </label>
              ))}
            </div>
            
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

      {isPaying ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="size-5 text-[#FAC54D]" />
                  Settle Commissions
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Technician: {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setIsPaying(false)}
                type="button"
                disabled={isSubmittingPayment}
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 min-h-[150px]">
              {isFetchingUnpaid ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner className="size-6 text-gray-400" />
                </div>
              ) : unpaidCommissions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <Banknote className="size-10 text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-700">All caught up!</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">There are no unpaid commissions for this technician.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
                    <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Unpaid Tasks</p>
                    <button 
                      onClick={() => {
                        if (selectedCommissions.size === unpaidCommissions.length) {
                          setSelectedCommissions(new Set());
                        } else {
                          setSelectedCommissions(new Set(unpaidCommissions.map(c => c.id)));
                        }
                      }}
                      className="text-xs font-bold text-[#FAC54D] hover:text-[#e0b040] transition-colors"
                      type="button"
                    >
                      {selectedCommissions.size === unpaidCommissions.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  {unpaidCommissions.map((commission) => (
                    <label 
                      key={commission.id} 
                      className={`flex items-center gap-4 rounded-[12px] border-2 p-4 cursor-pointer transition-all ${selectedCommissions.has(commission.id) ? "border-[#FAC54D] bg-[#FAC54D]/5" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={selectedCommissions.has(commission.id)}
                          onChange={() => toggleCommissionSelection(commission.id)}
                        />
                        <div className="size-5 rounded border-2 border-gray-300 bg-white transition-all peer-checked:border-[#FAC54D] peer-checked:bg-[#FAC54D]"></div>
                        <svg className="pointer-events-none absolute size-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{commission.reason}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{new Date(commission.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-700">Rs. {commission.amount}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {unpaidCommissions.length > 0 && !isFetchingUnpaid && (
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Selected</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    Rs. {unpaidCommissions.filter(c => selectedCommissions.has(c.id)).reduce((sum, c) => sum + c.amount, 0)}
                  </p>
                </div>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  disabled={isSubmittingPayment || selectedCommissions.size === 0}
                  onClick={submitPayment}
                  type="button"
                >
                  {isSubmittingPayment ? <LoadingSpinner className="size-4" /> : <Banknote className="size-4" />}
                  {isSubmittingPayment ? "Processing..." : `Pay Rs. ${unpaidCommissions.filter(c => selectedCommissions.has(c.id)).reduce((sum, c) => sum + c.amount, 0)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          deleteRecord();
        }}
        title="Delete Technician"
        description={`Are you sure you want to permanently delete technician ${name}?`}
        confirmText="Delete"
        type="delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
