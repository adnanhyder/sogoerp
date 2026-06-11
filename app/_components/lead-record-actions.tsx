"use client";

import { CalendarClock, Pencil, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

type LeadRecordActionsProps = {
  budget: string;
  followUpAt: string;
  id: string;
  location: string;
  name: string;
  phone: string;
  source: string;
  stage: string;
  vehicleType: string;
  whatsapp: string;
};

const stageOptions = [
  "new_lead",
  "contacted",
  "interested",
  "negotiation",
  "matured",
  "installation_scheduled",
  "installed",
  "lost",
];

function toDateTimeInput(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  parsed.setMinutes(parsed.getMinutes() - parsed.getTimezoneOffset());
  return parsed.toISOString().slice(0, 16);
}

export function LeadRecordActions({
  budget,
  followUpAt,
  id,
  location,
  name,
  phone,
  source,
  stage,
  vehicleType,
  whatsapp,
}: LeadRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWinning, setIsWinning] = useState(false);
  const [draftName, setDraftName] = useState(name === "-" ? "" : name);
  const [draftPhone, setDraftPhone] = useState(phone === "-" ? "" : phone);
  const [draftWhatsapp, setDraftWhatsapp] = useState(whatsapp === "-" ? "" : whatsapp);
  const [draftSource, setDraftSource] = useState(source === "-" ? "" : source);
  const [draftLocation, setDraftLocation] = useState(location === "-" ? "" : location);
  const [draftVehicleType, setDraftVehicleType] = useState(vehicleType === "-" ? "" : vehicleType);
  const [draftBudget, setDraftBudget] = useState(budget === "0" ? "" : budget);
  const [draftStage, setDraftStage] = useState(stage || "new_lead");
  const [draftFollowUpAt, setDraftFollowUpAt] = useState(toDateTimeInput(followUpAt));
  const busy = isSaving || isWinning;

  async function saveLead() {
    setError("");
    setIsSaving(true);

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "leads",
        values: {
          budget: draftBudget,
          location: draftLocation,
          name: draftName,
          next_follow_up_at: draftFollowUpAt,
          phone: draftPhone,
          source: draftSource,
          stage: draftStage,
          vehicle_type: draftVehicleType,
          whatsapp: draftWhatsapp,
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update this lead.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function winCase() {
    setError("");
    setIsWinning(true);

    const response = await fetch("/api/erp/lead-win", {
      body: JSON.stringify({ leadId: id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };

    setIsWinning(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to convert this lead.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-60"
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
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={() => {
            setError("");
            setIsEditing(true);
          }}
          type="button"
        >
          <CalendarClock className="size-3" />
          Follow-up
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={winCase}
          title={`Convert ${name} to customer`}
          type="button"
        >
          {isWinning ? <LoadingSpinner className="size-3" /> : <Trophy className="size-3" />}
          {isWinning ? "Winning" : "Win Case"}
        </button>
      </div>

      {isEditing ? (
        <div className="w-[340px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2">
            <label className="text-xs font-bold text-black">
              Lead Name
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftName(event.target.value)} value={draftName} />
            </label>
            <label className="text-xs font-bold text-black">
              Phone
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftPhone(event.target.value)} value={draftPhone} />
            </label>
            <label className="text-xs font-bold text-black">
              WhatsApp
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftWhatsapp(event.target.value)} value={draftWhatsapp} />
            </label>
            <label className="text-xs font-bold text-black">
              Source
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftSource(event.target.value)} value={draftSource} />
            </label>
            <label className="text-xs font-bold text-black">
              Location / Area
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftLocation(event.target.value)} value={draftLocation} />
            </label>
            <label className="text-xs font-bold text-black">
              Vehicle Type
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftVehicleType(event.target.value)} value={draftVehicleType} />
            </label>
            <label className="text-xs font-bold text-black">
              Budget
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftBudget(event.target.value)} step="0.01" type="number" value={draftBudget} />
            </label>
            <label className="text-xs font-bold text-black">
              Stage
              <select className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftStage(event.target.value)} value={draftStage}>
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-black">
              Next Follow-up Date & Time
              <input className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black" onChange={(event) => setDraftFollowUpAt(event.target.value)} type="datetime-local" value={draftFollowUpAt} />
            </label>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
              disabled={busy}
              onClick={saveLead}
              type="button"
            >
              {isSaving ? <LoadingSpinner className="size-3" /> : null}
              {isSaving ? "Saving" : "Save Lead"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[240px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
