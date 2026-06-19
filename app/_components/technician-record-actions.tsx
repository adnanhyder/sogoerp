"use client";

import { Ban, Pencil, ShieldAlert, Trash2, X, Banknote, CheckCircle2, Link2, Truck, Package, Users, AlertCircle } from "lucide-react";
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

type PaidCommission = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  receipt_url?: string;
};

type ConnectedDevice = {
  id: string;
  imei: string;
  status: string;
  custodyStatus: string;
  courierCompany: string;
  consignmentNumber: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
};

type ConnectedLead = {
  id: string;
  name: string;
  phone: string;
  stage: string;
  location: string;
  vehicleType: string;
  budget: string;
  deviceImei: string;
  deviceCustody: string;
  deviceCourier: string;
  deviceConsignment: string;
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
  disputeReason?: string;
  id: string;
  name: string;
  phone: string;
  unpaidPending?: number;
  installedCount?: number;
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
  disputeReason = "",
  id,
  name,
  phone,
  unpaidPending = 0,
  installedCount = 0,
}: TechnicianRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isFetchingUnpaid, setIsFetchingUnpaid] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOption, setDisputeOption] = useState("Faulty Installation / Wiring Issue");
  const [customDisputeReason, setCustomDisputeReason] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [unpaidCommissions, setUnpaidCommissions] = useState<UnpaidCommission[]>([]);
  const [paidCommissions, setPaidCommissions] = useState<PaidCommission[]>([]);
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [showPaidHistory, setShowPaidHistory] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isTogglingDispute, setIsTogglingDispute] = useState(false);
  // Connected data panel
  const [showConnected, setShowConnected] = useState(false);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [connectedLeads, setConnectedLeads] = useState<ConnectedLead[]>([]);
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

  async function fetchConnectedData() {
    setIsLoadingConnected(true);
    try {
      const res = await fetch(`/api/erp/technicians/connected?technicianId=${id}`);
      const payload = (await res.json()) as { devices?: ConnectedDevice[]; leads?: ConnectedLead[]; error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to load connected data");
      setConnectedDevices(payload.devices ?? []);
      setConnectedLeads(payload.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading connected data");
    } finally {
      setIsLoadingConnected(false);
    }
  }

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

  async function submitDispute() {
    setError("");
    setIsTogglingDispute(true);
    const finalReason = disputeOption === "Other (Custom Reason)" ? customDisputeReason : disputeOption;
    if (disputeOption === "Other (Custom Reason)" && !customDisputeReason.trim()) {
      setError("Please specify the dispute reason.");
      setIsTogglingDispute(false);
      return;
    }

    try {
      await updateTechnician({ disputed: true, dispute_reason: finalReason });
      setShowDisputeModal(false);
      router.refresh();
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Unable to update dispute status.");
    } finally {
      setIsTogglingDispute(false);
    }
  }

  async function clearDispute() {
    setError("");
    setIsTogglingDispute(true);

    try {
      await updateTechnician({ disputed: false, dispute_reason: null });
      router.refresh();
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Unable to clear dispute status.");
    } finally {
      setIsTogglingDispute(false);
    }
  }

  async function openPaymentModal() {
    setIsPaying(true);
    setIsFetchingUnpaid(true);
    setError("");
    setSelectedCommissions(new Set());
    setShowPaidHistory(false);

    try {
      const [unpaidRes, paidRes] = await Promise.all([
        fetch(`/api/erp/technicians/unpaid?technicianId=${id}`),
        fetch(`/api/erp/technicians/paid?technicianId=${id}`),
      ]);
      const unpaidPayload = (await unpaidRes.json()) as { unpaid?: UnpaidCommission[]; error?: string };
      const paidPayload = (await paidRes.json()) as { paid?: PaidCommission[]; error?: string };
      if (!unpaidRes.ok) throw new Error(unpaidPayload.error ?? "Failed to fetch unpaid commissions");
      setUnpaidCommissions(unpaidPayload.unpaid ?? []);
      setPaidCommissions(paidPayload.paid ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching commissions");
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

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }



  async function submitPayment() {
    if (selectedCommissions.size === 0) return;
    setIsSubmittingPayment(true);
    setError("");

    try {
      let receiptDataUrl: string | undefined;
      if (receiptFile) {
        receiptDataUrl = await fileToBase64(receiptFile);
      }

      const res = await fetch("/api/erp/technicians/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId: id,
          commissionIds: Array.from(selectedCommissions),
          receiptUrl: receiptDataUrl,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to process payment");

      // Move paid commissions to the paid list locally
      const nowPaid = unpaidCommissions.filter(c => selectedCommissions.has(c.id));
      const nowPaidWithReceipt = nowPaid.map(c => ({ ...c, receipt_url: receiptDataUrl }));
      setPaidCommissions(prev => [...nowPaidWithReceipt, ...prev]);
      setUnpaidCommissions(prev => prev.filter(c => !selectedCommissions.has(c.id)));
      setSelectedCommissions(new Set());
      setReceiptFile(null);
      router.refresh();
      window.dispatchEvent(new Event("payment-settled"));
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
          onClick={disputed ? clearDispute : () => setShowDisputeModal(true)}
          type="button"
        >
          {isTogglingDispute ? <LoadingSpinner className="size-3" /> : <ShieldAlert className="size-3" />}
          {disputed ? "Clear Dispute" : "Dispute"}
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
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 py-2 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            setError("");
            setShowConnected(true);
            fetchConnectedData();
          }}
          type="button"
        >
          <Link2 className="size-3" />
          Connected Data
        </button>
        {installedCount > 0 && unpaidPending > 0 && (
          <button
            className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-[#FAC54D] px-3 py-2 text-xs font-bold text-gray-900 transition hover:bg-[#e0b040] disabled:cursor-wait disabled:opacity-50 shadow-sm"
            disabled={busy}
            onClick={openPaymentModal}
            type="button"
          >
            <Banknote className="size-3" />
            Settle Payment
          </button>
        )}
      </div>

      {disputed && disputeReason && (
        <div className="mt-2.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-100 rounded-[8px] px-3 py-1.5 flex items-center gap-2 w-fit animate-[fadeIn_0.2s_ease-out] shadow-sm">
          <ShieldAlert className="size-4 text-red-500 shrink-0" />
          <span>Disputed: {disputeReason}</span>
        </div>
      )}

      {/* Receipt Screenshot Lightbox */}
      {selectedReceiptUrl && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedReceiptUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedReceiptUrl(null)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="size-4 text-gray-700" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedReceiptUrl}
              alt="Payment Receipt"
              className="max-w-full max-h-[85vh] rounded-[12px] shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

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
            
            {!isFetchingUnpaid && (
              <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
                {unpaidCommissions.length > 0 && (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                        Payment Receipt Screenshot <span className="text-gray-400 font-normal normal-case">(optional)</span>
                      </span>
                      <input
                        className="w-full text-sm text-gray-500 file:mr-4 file:rounded-[10px] file:border-0 file:bg-[#FAC54D]/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-gray-700 hover:file:bg-[#FAC54D]/20 transition-all cursor-pointer"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setReceiptFile(file ?? null);
                        }}
                      />
                      {receiptFile && (
                        <p className="mt-1 text-[10px] font-semibold text-green-600">✓ {receiptFile.name} selected</p>
                      )}
                    </label>
                    <div className="flex items-center justify-between">
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
                  </>
                )}

                {/* Paid History Toggle */}
                {paidCommissions.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPaidHistory(h => !h)}
                      className="flex w-full items-center justify-between text-xs font-extrabold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-green-500" />
                        Paid Records ({paidCommissions.length})
                      </span>
                      <span className="text-[10px] normal-case font-bold text-gray-400">
                        {showPaidHistory ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showPaidHistory && (
                      <div className="mt-3 overflow-hidden rounded-[12px] border border-gray-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="whitespace-nowrap px-4 py-2.5 text-left font-extrabold text-gray-500 uppercase tracking-wider">Reason</th>
                              <th className="whitespace-nowrap px-4 py-2.5 text-left font-extrabold text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="whitespace-nowrap px-4 py-2.5 text-right font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {paidCommissions.map((c) => (
                              <tr key={c.id} className="hover:bg-green-50/30 transition-colors">
                                <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">{c.reason}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-black text-green-700">Rs. {c.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-green-50 border-t border-green-100">
                              <td colSpan={2} className="px-4 py-3 font-extrabold text-green-800 text-xs uppercase tracking-wider">Total Paid</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-black text-green-800">Rs. {paidCommissions.reduce((s, c) => s + c.amount, 0)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Connected Data Panel */}
      {showConnected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[620px] rounded-[24px] bg-white shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Link2 className="size-5 text-[#FAC54D]" />
                  Connected Data
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">Technician: {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setShowConnected(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingConnected ? (
                <div className="flex h-32 items-center justify-center">
                  <LoadingSpinner className="size-6 text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Devices Section */}
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                      <Package className="size-3.5" /> Assigned Devices ({connectedDevices.length})
                    </p>
                    {connectedDevices.length === 0 ? (
                      <div className="rounded-[12px] border border-dashed border-gray-200 p-5 text-center text-sm font-medium text-gray-400">
                        No devices assigned to this technician.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connectedDevices.map((device) => {
                          const isOnWay = device.custodyStatus === "on_the_way";
                          const isReceived = device.custodyStatus === "received_by_technician";
                          const isInstalled = device.status === "installed" || device.custodyStatus === "customer_hands";
                          return (
                            <div
                              key={device.id}
                              className={`rounded-[12px] border-2 p-4 ${
                                isOnWay
                                  ? "border-amber-300 bg-amber-50"
                                  : isInstalled
                                    ? "border-green-200 bg-green-50"
                                    : isReceived
                                      ? "border-blue-200 bg-blue-50"
                                      : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-gray-900">IMEI: {device.imei}</span>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                      isOnWay
                                        ? "bg-amber-200 text-amber-800"
                                        : isInstalled
                                          ? "bg-green-200 text-green-800"
                                          : isReceived
                                            ? "bg-blue-200 text-blue-800"
                                            : "bg-gray-200 text-gray-700"
                                    }`}>
                                      {isOnWay && <Truck className="size-2.5" />}
                                      {isInstalled && <CheckCircle2 className="size-2.5" />}
                                      {device.custodyStatus.replaceAll("_", " ")}
                                    </span>
                                  </div>
                                  {device.customerName !== "-" && (
                                    <p className="mt-1.5 text-xs font-semibold text-gray-600">
                                      👤 {device.customerName} · {device.customerPhone}
                                      {device.customerLocation && device.customerLocation !== "-" && ` · ${device.customerLocation}`}
                                    </p>
                                  )}
                                  {isOnWay && device.courierCompany && (
                                    <div className="mt-2 rounded-[8px] bg-amber-100 border border-amber-200 px-3 py-2">
                                      <p className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">🚚 In Transit</p>
                                      <p className="text-xs font-bold text-amber-900">Courier: {device.courierCompany}</p>
                                      {device.consignmentNumber && (
                                        <p className="text-xs font-bold text-amber-900">Consignment: {device.consignmentNumber}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Leads Section */}
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                      <Users className="size-3.5" /> Assigned Leads ({connectedLeads.length})
                    </p>
                    {connectedLeads.length === 0 ? (
                      <div className="rounded-[12px] border border-dashed border-gray-200 p-5 text-center text-sm font-medium text-gray-400">
                        No leads assigned to this technician.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connectedLeads.map((lead) => {
                          const isDeviceOnWay = lead.deviceCustody === "on_the_way";
                          return (
                            <div key={lead.id} className={`rounded-[12px] border-2 p-4 ${ isDeviceOnWay ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50" }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-black text-gray-900">{lead.name}</p>
                                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{lead.phone} · {lead.location}</p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gray-700">
                                      {lead.stage.replaceAll("_", " ")}
                                    </span>
                                    {lead.vehicleType && (
                                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                        {lead.vehicleType}
                                      </span>
                                    )}
                                    {lead.budget && (
                                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                        Rs. {lead.budget}
                                      </span>
                                    )}
                                  </div>
                                  {lead.deviceImei && (
                                    <div className={`mt-2 rounded-[8px] px-3 py-2 border ${ isDeviceOnWay ? "bg-amber-100 border-amber-200" : "bg-blue-50 border-blue-200" }`}>
                                      <p className={`text-[11px] font-extrabold uppercase tracking-wider mb-0.5 ${ isDeviceOnWay ? "text-amber-800" : "text-blue-800" }`}>
                                        📦 Device: {lead.deviceImei}
                                      </p>
                                      <p className="text-[10px] font-bold text-gray-600">
                                        Status: {lead.deviceCustody.replaceAll("_", " ")}
                                      </p>
                                      {isDeviceOnWay && lead.deviceCourier && (
                                        <p className="text-[10px] font-bold text-amber-800">
                                          🚚 {lead.deviceCourier} · {lead.deviceConsignment}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {isDeviceOnWay && (
                                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end p-5 border-t border-gray-100">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border-2 border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                onClick={() => { setShowConnected(false); fetchConnectedData(); }}
                type="button"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showDisputeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mark Technician as Disputed</h3>
                <p className="text-xs text-gray-500 font-medium">Select a reason to flag this technician</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-[8px] p-3">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-700">Dispute Reason</span>
                <select
                  value={disputeOption}
                  onChange={(e) => setDisputeOption(e.target.value)}
                  className="h-11 w-full appearance-none rounded-[10px] border-2 border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-[#FAC54D]"
                >
                  <option value="Faulty Installation / Wiring Issue">Faulty Installation / Wiring Issue</option>
                  <option value="Device Damaged during Installation">Device Damaged during Installation</option>
                  <option value="Late Arrival / No Show">Late Arrival / No Show</option>
                  <option value="Commission / Payout Discrepancy">Commission / Payout Discrepancy</option>
                  <option value="Fuel / Expense Allowance Issue">Fuel / Expense Allowance Issue</option>
                  <option value="Unprofessional Customer Conduct">Unprofessional Customer Conduct</option>
                  <option value="Assigned Device Missing / Lost">Assigned Device Missing / Lost</option>
                  <option value="Other (Custom Reason)">Other (Custom Reason)</option>
                </select>
              </label>

              {disputeOption === "Other (Custom Reason)" && (
                <label className="block animate-[fadeIn_0.2s_ease-out]">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-700">Specify Custom Reason *</span>
                  <textarea
                    rows={3}
                    placeholder="Enter custom dispute reason..."
                    value={customDisputeReason}
                    onChange={(e) => setCustomDisputeReason(e.target.value)}
                    className="w-full rounded-[10px] border-2 border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-[#FAC54D]"
                  />
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="h-10 rounded-[8px] px-4 text-xs font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitDispute}
                  className="inline-flex h-10 items-center justify-center rounded-[8px] bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  Flag Disputed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
