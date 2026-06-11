"use client";

import { CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

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

  useEffect(() => {
    let ignore = false;

    async function loadTechnicians() {
      const response = await fetch("/api/erp/options/technicians", { cache: "no-store" });
      const payload = (await response.json()) as { technicians?: TechnicianOption[] };

      if (!ignore) {
        const ordered = [...(payload.technicians ?? [])].sort((a, b) => {
          const aSuggested = isSuggested(location, a) ? 1 : 0;
          const bSuggested = isSuggested(location, b) ? 1 : 0;
          return bSuggested - aSuggested || a.name.localeCompare(b.name);
        });
        setTechnicians(ordered);
      }
    }

    void loadTechnicians();

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
              <input
                className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                onChange={(event) => setScheduledAt(event.target.value)}
                type="datetime-local"
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

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
