"use client";

import { X, CalendarClock, CheckCircle2, RotateCcw, Trash } from "lucide-react";
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

export function CustomerRecordActions({ customerId, installStatus = "none", location, name }: CustomerRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [technicianId, setTechnicianId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(localDateTimeNow);
  const [conversationNotes, setConversationNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState("scheduled");

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

  async function saveMeeting() {
    setError("");
    setLoading(true);

    const response = await fetch("/api/erp/customer-meetings", {
      body: JSON.stringify({
        conversationNotes,
        customerId,
        outcome,
        scheduledAt,
        status,
        technicianId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };

    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save this meeting.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

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
        completedAt: installCompletedAt,
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
    router.refresh();
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
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-60"
        disabled={loading}
        onClick={() => setOpen((current) => !current)}
        title={`Schedule technician meeting for ${name}`}
        type="button"
      >
        <CalendarClock className="size-3" />
        {open ? "Close" : "Meeting"}
      </button>

      {installStatus === "completed" ? (
        <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
          <CheckCircle2 className="size-3" />
          Success
        </span>
      ) : (
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:border-green-500 disabled:cursor-wait disabled:opacity-50"
          disabled={loading || isInstalling}
          onClick={() => {
            setOpen(false);
            setIsInstallOpen((current) => !current);
          }}
          title={`Record installation success for ${name}`}
          type="button"
        >
          <CheckCircle2 className="size-3" />
          {isInstallOpen ? "Cancel" : "Success"}
        </button>
      )}

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

      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Schedule Meeting</h3>
                <p className="text-sm text-gray-500 font-medium">For customer {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Technician</span>
                <select
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setTechnicianId(event.target.value)}
                  value={technicianId}
                >
                  <option value="">Select technician</option>
                  {technicians.map((technician) => (
                    <option disabled={!technician.active} key={technician.id} value={technician.id}>
                      {isSuggested(location, technician) ? "Suggested: " : ""}
                      {technician.name} / {technician.cities || "No city"} / {technician.deviceCount} devices
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Meeting Date & Time</span>
                <DateTimePicker
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={setScheduledAt}
                  value={scheduledAt}
                />
              </label>
              
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Status</span>
                <select
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Conversation Record</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setConversationNotes(event.target.value)}
                  placeholder="What was discussed?"
                  value={conversationNotes}
                />
              </label>
              
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Meeting Outcome</span>
                <input
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={(event) => setOutcome(event.target.value)}
                  placeholder="Client busy, completed, needs visit..."
                  value={outcome}
                />
              </label>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                className="inline-flex h-12 items-center justify-center rounded-[12px] border-2 border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 focus:border-gray-300 focus:ring-4 focus:ring-gray-200/50 disabled:opacity-50"
                onClick={() => setOpen(false)}
                type="button"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={loading}
                onClick={saveMeeting}
                type="button"
              >
                {loading ? <LoadingSpinner className="size-4" /> : status === "rescheduled" ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                {loading ? "Saving..." : "Save Meeting"}
              </button>
            </div>
          </div>
        </div>
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

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
      {installSuccessMessage ? <p className="max-w-[260px] text-xs font-semibold text-green-700">{installSuccessMessage}</p> : null}
    </div>
  );
}
