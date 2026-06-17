"use client";

import { X, CalendarClock, CheckCircle2, RotateCcw, Trash, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";

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

export function CustomerRecordActions({ customerId, installStatus = "none", location, name, sourceLeadId }: CustomerRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
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

  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [devices, setDevices] = useState<{ id: string; imei: string; technicianName: string }[]>([]);
  const [installDeviceId, setInstallDeviceId] = useState("");
  const [installTechnicianId, setInstallTechnicianId] = useState("");
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
        setDevices(devPayload.devices ?? []);
      }
    }

    void loadOptions();

    return () => {
      ignore = true;
    };
  }, [location]);

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
    if (!confirm(`Are you sure you want to permanently delete ${name}? This will also remove their vehicles, work orders, meetings, and insurance policies. Any installed devices will be returned to inventory.`)) {
      return;
    }

    setError("");
    setLoading(true);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({
        id: customerId,
        moduleKey: "customers",
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
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-green-600 px-3 text-xs font-bold text-white cursor-not-allowed select-none"
          disabled
          title="This customer's case has already been won"
          type="button"
        >
          <Trophy className="size-3" />
          Case Won ✓
        </button>
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

      {installStatus !== "completed" ? (
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-500 disabled:cursor-wait disabled:opacity-50"
          disabled={loading}
          onClick={deleteCustomer}
          title={`Delete ${name}`}
          type="button"
        >
          <Trash className="size-3" />
          Delete
        </button>
      ) : null}

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
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setInstallDeviceId(event.target.value)}
                  value={installDeviceId}
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
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setInstallTechnicianId(event.target.value)}
                  value={installTechnicianId}
                >
                  <option value="">Select technician</option>
                  {technicians.map((technician) => (
                    <option disabled={!technician.active} key={technician.id} value={technician.id}>
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
                      className="h-20 w-full rounded-[12px] border-2 border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      placeholder="Why did the technician meeting fail? (e.g., client out of city, cancelled, not reachable...)"
                      value={followUpReason}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Additional Admin Notes</span>
                    <textarea
                      className="h-20 w-full rounded-[12px] border-2 border-gray-200 p-3 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Enter additional meeting details or technician feedback..."
                      value={followUpNotes}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Next Follow-up Date & Time</span>
                    <DateTimePicker
                      className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                      onChange={setFollowUpNextAt}
                      value={followUpNextAt}
                    />
                  </label>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingFollowUp}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isSavingFollowUp ? <LoadingSpinner className="size-4" /> : null}
                      {isSavingFollowUp ? "Logging..." : "Log Follow-up"}
                    </button>
                  </div>
                </form>

                <div className="my-6 h-px bg-gray-100" />
              </>
            ) : (
              <div className="mb-6 rounded-[12px] border border-[#FAC54D]/30 bg-[#FAC54D]/10 p-4 text-center text-sm font-bold text-[#b0882e]">
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
                      className="relative rounded-[16px] border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:border-[#FAC54D]/50 hover:shadow-sm cursor-pointer group"
                    >
                      <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">
                        Logged on {new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="mb-2">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider mb-0.5">Reason for Not Meeting</span>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#b58b29] transition-colors">{item.reason}</p>
                      </div>
                      {item.notes ? (
                        <div className="mb-2">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider mb-0.5">Admin Notes</span>
                          <p className="text-xs font-semibold text-gray-700 line-clamp-1">{item.notes}</p>
                        </div>
                      ) : null}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
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
                  <p className="text-sm font-bold text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedFollowUp.reason}</p>
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

              <div className="rounded-[12px] border-2 border-[#FAC54D]/30 bg-[#FAC54D]/5 p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#b58b29]">Next Scheduled Follow-up:</span>
                <span className="text-xs font-extrabold text-gray-900">
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
    </div>
  );
}
