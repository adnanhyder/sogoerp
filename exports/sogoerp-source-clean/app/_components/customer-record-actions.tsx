"use client";

import { CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
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

export function CustomerRecordActions({ customerId, location, name }: CustomerRecordActionsProps) {
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

      {open ? (
        <div className="w-[320px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-black">
              Technician
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
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
            <label className="text-xs font-bold text-black">
              Meeting Date & Time
              <DateTimePicker
                className="mt-1 h-9 text-xs"
                onChange={setScheduledAt}
                value={scheduledAt}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Status
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="scheduled">scheduled</option>
                <option value="rescheduled">rescheduled</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
            <label className="text-xs font-bold text-black">
              Conversation Record
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setConversationNotes(event.target.value)}
                placeholder="What was discussed?"
                value={conversationNotes}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Meeting Outcome
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setOutcome(event.target.value)}
                placeholder="Client busy, completed, needs visit..."
                value={outcome}
              />
            </label>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
              disabled={loading}
              onClick={saveMeeting}
              type="button"
            >
              {loading ? <LoadingSpinner className="size-3" /> : status === "rescheduled" ? <RotateCcw className="size-3" /> : <CheckCircle2 className="size-3" />}
              {loading ? "Saving" : "Save Meeting"}
            </button>
          </div>
        </div>
      ) : null}
      {isInstallOpen ? (
        <div className="w-[320px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-black">
              Device (IMEI)
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
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
            <label className="text-xs font-bold text-black">
              Installed By
              <select
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black"
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
            <label className="text-xs font-bold text-black">
              Success Date & Time
              <DateTimePicker
                className="mt-1 h-9 text-xs"
                onChange={setInstallCompletedAt}
                value={installCompletedAt}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Sale Price
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setInstallSalePrice(event.target.value)}
                step="0.01"
                type="number"
                value={installSalePrice}
              />
            </label>
            <label className="text-xs font-bold text-black">
              Technician Commission
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setInstallCommissionAmount(event.target.value)}
                step="0.01"
                type="number"
                value={installCommissionAmount}
              />
            </label>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
              disabled={isInstalling}
              onClick={markInstallSuccess}
              type="button"
            >
              {isInstalling ? <LoadingSpinner className="size-3" /> : <CheckCircle2 className="size-3" />}
              {isInstalling ? "Recording" : "Record Success"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
      {installSuccessMessage ? <p className="max-w-[260px] text-xs font-semibold text-green-700">{installSuccessMessage}</p> : null}
    </div>
  );
}
