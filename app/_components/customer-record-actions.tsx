"use client";

import { X, CalendarClock, CheckCircle2, RotateCcw, Trash, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";
import { AlertModal } from "./alert-modal";

type TechnicianOption = {
  active: boolean;
  cities: string;
  deviceCount: number;
  id: string;
  name: string;
};

type CustomerRecordActionsProps = {
  customerId: string;
  installStatus?: string;
  location: string;
  name: string;
  sourceLeadId?: string;
  assignedTechnicianId?: string;
  assignedDeviceId?: string;
};

function localDateTimeNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function isSuggested(location: string, technician: TechnicianOption) {
  const normalizedLocation = location.toLowerCase();
  const coverage = technician.cities.toLowerCase();

  return normalizedLocation
    .split(/[,\s/]+/)
    .some((part) => part.length > 2 && coverage.includes(part));
}

export function CustomerRecordActions({ customerId, installStatus = "none", location, name, sourceLeadId, assignedTechnicianId, assignedDeviceId }: CustomerRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Follow-up States
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpNextAt, setFollowUpNextAt] = useState("");
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [technicianId, setTechnicianId] = useState("");

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteNotes, setDeleteNotes] = useState("");

  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [devices, setDevices] = useState<{ id: string; imei: string; technicianName: string }[]>([]);
  const [installDeviceId, setInstallDeviceId] = useState(assignedDeviceId || "");
  const [installTechnicianId, setInstallTechnicianId] = useState(assignedTechnicianId || "");
  const [installCompletedAt, setInstallCompletedAt] = useState(localDateTimeNow);
  const [installSalePrice, setInstallSalePrice] = useState("");
  const [installCommissionAmount, setInstallCommissionAmount] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccessMessage, setInstallSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      const [techRes, devRes] = await Promise.all([
        fetch("/api/erp/options/technicians", { cache: "no-store" }),
        fetch("/api/erp/options/devices", { cache: "no-store" })
      ]);
      const techPayload = (await techRes.json()) as { technicians?: TechnicianOption[] };
      const devPayload = (await devRes.json()) as { devices?: any[] };

      if (!ignore) {
        const ordered = [...(techPayload.technicians ?? [])].sort((a, b) => {
          const aSuggested = isSuggested(location, a) ? 1 : 0;
          const bSuggested = isSuggested(location, b) ? 1 : 0;
          return bSuggested - aSuggested || a.name.localeCompare(b.name);
        });
        setTechnicians(ordered);

        let deviceList = devPayload.devices ?? [];

        // If a device was pre-assigned (e.g. already installed), fetch it specifically
        // so it still appears in the dropdown even though it's filtered out of the available list
        if (assignedDeviceId && !deviceList.some((d: any) => d.id === assignedDeviceId)) {
          try {
            const assignedDevRes = await fetch(`/api/erp/options/devices?includeId=${assignedDeviceId}`, { cache: "no-store" });
            const assignedDevPayload = (await assignedDevRes.json()) as { device?: any };
            if (assignedDevPayload.device) {
              deviceList = [assignedDevPayload.device, ...deviceList];
            }
          } catch {
            // If specific fetch fails, just continue with available devices list
          }
        }

        setDevices(deviceList);
      }
    }

    void loadOptions();

    return () => {
      ignore = true;
    };
  }, [location, assignedDeviceId]);

  async function markInstallSuccess() {
    if (!installDeviceId) {
      setError("Select the installed device.");
      return;
    }
    if (!installTechnicianId) {
      setError("Select the technician who installed this device.");
      return;
    }

    setError("");
    setInstallSuccessMessage("");
    setIsInstalling(true);

    const response = await fetch("/api/erp/install-success", {
      body: JSON.stringify({
        commissionAmount: installCommissionAmount,
        completedAt: installCompletedAt ? new Date(installCompletedAt).toISOString() : "",
        customerId,
        deviceId: installDeviceId,
        salePrice: installSalePrice,
        technicianId: installTechnicianId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };

    setIsInstalling(false);

    if (!response.ok) {
      setError(payload.error ?? "Failed to record installation success.");
      return;
    }

    setInstallSuccessMessage("Install success recorded.");
    setIsInstallOpen(false);
    setShowCongrats(true);
    router.refresh();
  }

  async function fetchFollowUps() {
    if (!sourceLeadId) return;
    setFollowUpsLoading(true);
    try {
      const res = await fetch(`/api/erp/leads/follow-up?leadId=${sourceLeadId}`);
      if (res.ok) {
        const payload = await res.json();
        setFollowUps(payload.followUps ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch follow-ups", err);
    } finally {
      setFollowUpsLoading(false);
    }
  }

  useEffect(() => {
    if (isFollowUpOpen && sourceLeadId) {
      fetchFollowUps();
    }
  }, [isFollowUpOpen, sourceLeadId]);

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceLeadId) {
       setError("This customer does not have a linked lead to add follow-ups to.");
       return;
    }
    if (!followUpReason.trim()) {
      setError("Please specify the client's reason for not meeting.");
      return;
    }
    if (!followUpNextAt) {
      setError("Please specify the next follow-up date and time.");
      return;
    }

    setError("");
    setIsSavingFollowUp(true);

    try {
      const res = await fetch("/api/erp/leads/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: sourceLeadId,
          reason: followUpReason,
          notes: followUpNotes,
          nextFollowUpAt: followUpNextAt ? new Date(followUpNextAt).toISOString() : "",
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        setError(payload.error ?? "Failed to add follow-up.");
        return;
      }

      setFollowUpReason("");
      setFollowUpNotes("");
      setFollowUpNextAt("");
      await fetchFollowUps();
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSavingFollowUp(false);
    }
  }

  async function deleteCustomer() {
    if (!deleteReason) {
      setError("Please select a reason for deletion.");
      return;
    }
    if (deleteReason === "Other" && !deleteNotes.trim()) {
      setError("Please provide a reason in the text area.");
      return;
    }

    setError("");
    setLoading(true);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({
        id: customerId,
        moduleKey: "customers",
        reason: deleteReason,
        notes: deleteReason === "Other" ? deleteNotes.replace("[FAILED] ", "") : "",
        status: deleteNotes.includes("[FAILED]") ? "failed" : "deleted",
      }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: string };

    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Failed to delete customer.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex gap-2">
        {sourceLeadId ? (
          <button
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-60"
            disabled={loading}
            onClick={() => {
              setError("");
              setIsFollowUpOpen(true);
            }}
            title="Follow-up Log"
            type="button"
          >
            <RotateCcw className="size-3" />
            Follow-up
          </button>
        ) : null}
      </div>

      {installStatus === "completed" ? (
        <div
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-green-50 px-3 text-xs font-bold text-green-700 border border-green-200"
          title="This customer's device has been installed successfully"
        >
          <CheckCircle2 className="size-3" />
          Installed Successfully
        </div>
      ) : (
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-60"
          disabled={loading || isInstalling}
          onClick={() => {
            setIsInstallOpen((current) => !current);
          }}
          title={`Win Case (Record Installation) for ${name}`}
          type="button"
        >
          <Trophy className="size-3" />
          {isInstallOpen ? "Cancel" : "Win Case"}
        </button>
      )}

      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-500 disabled:cursor-wait disabled:opacity-50"
        disabled={loading}
        onClick={() => setIsDeleteModalOpen(true)}
        title={`Delete ${name}`}
        type="button"
      >
        <Trash className="size-3" />
        Delete
      </button>

      {isInstallOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Record Installation</h3>
                <p className="text-sm text-gray-500 font-medium">For customer {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setIsInstallOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Device (IMEI)</span>
                <select
                  className={`h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20 ${assignedDeviceId ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"}`}
                  onChange={(event) => setInstallDeviceId(event.target.value)}
                  value={installDeviceId}
                  disabled={!!assignedDeviceId}
                >
                  <option value="">Select a device</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.imei} {device.technicianName ? `(${device.technicianName})` : "(Unassigned)"}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Installed By</span>
                <select
                  className={`h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20 ${assignedTechnicianId ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"}`}
                  onChange={(event) => setInstallTechnicianId(event.target.value)}
                  value={installTechnicianId}
                  disabled={!!assignedTechnicianId}
                >
                  <option value="">Select technician</option>
                  {technicians.map((technician) => (
                    <option disabled={!technician.active && technician.id !== installTechnicianId} key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Success Date & Time</span>
                <DateTimePicker
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={setInstallCompletedAt}
                  value={installCompletedAt}
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Sale Price</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setInstallSalePrice(event.target.value)}
                  step="0.01"
                  type="number"
                  value={installSalePrice}
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Tech Commission</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setInstallCommissionAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={installCommissionAmount}
                />
              </label>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                className="inline-flex h-12 items-center justify-center rounded-[12px] border-2 border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 focus:border-gray-300 focus:ring-4 focus:ring-gray-200/50 disabled:opacity-50"
                onClick={() => setIsInstallOpen(false)}
                type="button"
                disabled={isInstalling}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={isInstalling}
                onClick={markInstallSuccess}
                type="button"
              >
                {isInstalling ? <LoadingSpinner className="size-4" /> : <CheckCircle2 className="size-4" />}
                {isInstalling ? "Recording..." : "Record Success"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isFollowUpOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[650px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Follow-up Log</h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">Notes and schedule for {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
                onClick={() => setIsFollowUpOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            {installStatus !== "completed" ? (
              <>
                {/* Form Section */}
                <form onSubmit={handleAddFollowUp} className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Client's Reason for Not Meeting</span>
                    <textarea
                      className="h-20 w-full rounded-[12px] border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/10"
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="Why did the technician meeting fail? (e.g., client out of city, cancelled, not reachable...)"
                      value={followUpReason}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Additional Admin Notes</span>
                    <textarea
                      className="h-20 w-full rounded-[12px] border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/10"
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Enter additional meeting details or technician feedback..."
                      value={followUpNotes}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Next Follow-up Date & Time</span>
                    <DateTimePicker
                      className="h-12 w-full rounded-[12px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/10"
                      onChange={setFollowUpNextAt}
                      value={followUpNextAt}
                    />
                  </label>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingFollowUp}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FAC54D] px-6 text-sm font-bold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-md focus:ring-4 focus:ring-[#FAC54D]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isSavingFollowUp ? <LoadingSpinner className="size-4" /> : null}
                      {isSavingFollowUp ? "Logging..." : "Log Follow-up"}
                    </button>
                  </div>
                </form>

                <div className="my-6 h-px bg-gray-100" />
              </>
            ) : (
              <div className="mb-6 rounded-[12px] border border-[#FAC54D]/20 bg-[#FAC54D]/5 p-4 text-center text-sm font-bold text-[#b0882e]">
                This case has been won. Follow-up notes are read-only.
              </div>
            )}

            {/* History Section */}
            <div>
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4">
                Follow-up History ({followUps.length})
              </h4>
              
              {followUpsLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner className="size-6 text-[#FAC54D]" />
                </div>
              ) : followUps.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-gray-200 p-6 text-center text-sm font-semibold text-gray-400">
                  No previous follow-up notes recorded.
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {followUps.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedFollowUp(item)}
                      title="Click to view details in a popup"
                      className="relative rounded-[16px] border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:border-[#FAC54D]/40 hover:shadow-sm cursor-pointer group"
                    >
                      <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">
                        Logged on {new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="mb-2">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider mb-0.5">Reason for Not Meeting</span>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#b58b29] transition-colors">{item.reason}</p>
                      </div>
                      {item.notes ? (
                        <div className="mb-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider mb-0.5">Admin Notes</span>
                          <p className="text-xs font-semibold text-gray-600 line-clamp-1">{item.notes}</p>
                        </div>
                      ) : null}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-100/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-[16px]">
                        <span className="text-[#b58b29] font-bold">Next Scheduled Follow-up:</span>
                        <span className="text-gray-900 font-bold">
                          {new Date(item.next_follow_up_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedFollowUp ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Follow-up Details</h3>
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider mt-1">
                  Logged on {new Date(selectedFollowUp.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setSelectedFollowUp(null)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <span className="mb-1.5 block text-[11px] font-extrabold text-[#b58b29] uppercase tracking-wider">Client's Reason for Not Meeting</span>
                <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedFollowUp.reason}</p>
                </div>
              </div>

              {selectedFollowUp.notes ? (
                <div>
                  <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Additional Admin Notes</span>
                  <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-4 max-h-[180px] overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedFollowUp.notes}</p>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[12px] border border-[#FAC54D]/20 bg-[#FAC54D]/5 p-4 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold text-[#b58b29]">Next Scheduled Follow-up:</span>
                <span className="text-xs font-bold text-gray-900">
                  {new Date(selectedFollowUp.next_follow_up_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 active:translate-y-0"
                onClick={() => setSelectedFollowUp(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
      {installSuccessMessage ? <p className="max-w-[260px] text-xs font-semibold text-green-700">{installSuccessMessage}</p> : null}

      {showCongrats ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-w-[400px] rounded-[32px] bg-white p-8 text-center shadow-[0_0_80px_rgba(250,197,77,0.3)] animate-[slideUpFade_0.4s_ease-out_both]">
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-[#FAC54D]/20 animate-[bounce_1s_ease-in-out_infinite]">
              <Trophy className="size-12 text-[#e0b040]" />
            </div>
            <h2 className="mb-2 text-3xl font-black text-gray-900 tracking-tight">Congratulations!</h2>
            <p className="mb-8 text-base font-medium text-gray-500">
              The case for <strong className="text-gray-900">{name}</strong> has been successfully won and recorded!
            </p>
            <button
              onClick={() => setShowCongrats(false)}
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-black px-8 text-base font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-[#343434]"
            >
              Awesome
            </button>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[450px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Customer</h3>
                <p className="text-sm text-gray-500">Why do you want to remove {name}?</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Action Type</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deleteStatus" 
                      value="deleted" 
                      checked={!deleteNotes.includes("[FAILED]")}
                      onChange={() => {
                        setDeleteNotes(deleteNotes.replace("[FAILED] ", ""));
                      }}
                      className="accent-red-600 size-4" 
                    />
                    <span className="text-sm font-bold text-gray-900">Deleted</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deleteStatus" 
                      value="failed" 
                      checked={deleteNotes.includes("[FAILED]")}
                      onChange={() => {
                        if (!deleteNotes.includes("[FAILED]")) {
                          setDeleteNotes("[FAILED] " + deleteNotes);
                        }
                      }}
                      className="accent-red-600 size-4" 
                    />
                    <span className="text-sm font-bold text-gray-900">Failed</span>
                  </label>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Reason</span>
                <select
                  className="h-12 w-full appearance-none rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                  onChange={(e) => {
                    setDeleteReason(e.target.value);
                    setError("");
                  }}
                  value={deleteReason}
                >
                  <option value="">Select a reason</option>
                  <option value="Duplicate Entry">Duplicate Entry</option>
                  <option value="Customer Requested">Customer Requested</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              {deleteReason === "Other" ? (
                <label className="block animate-[fadeIn_0.2s_ease-out]">
                  <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Specify Reason</span>
                  <textarea
                    className="w-full resize-none rounded-[12px] border-2 border-gray-200 p-4 text-sm font-medium text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                    onChange={(e) => {
                      setDeleteNotes(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter custom reason..."
                    rows={3}
                    value={deleteNotes}
                  />
                </label>
              ) : null}

              <div className="rounded-[12px] bg-red-50 p-4 text-xs font-semibold text-red-800">
                This action cannot be undone. All related records will also be permanently deleted.
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-gray-100 px-5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                disabled={loading}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteReason("");
                  setDeleteNotes("");
                  setError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                disabled={loading || !deleteReason}
                onClick={deleteCustomer}
                type="button"
              >
                {loading ? <LoadingSpinner className="size-4" /> : null}
                {loading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
