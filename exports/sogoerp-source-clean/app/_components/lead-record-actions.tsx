"use client";

import { CalendarClock, Pencil, Trophy, X, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftName, setDraftName] = useState(name === "-" ? "" : name);
  const [draftPhone, setDraftPhone] = useState(phone === "-" ? "" : phone);
  const [draftWhatsapp, setDraftWhatsapp] = useState(whatsapp === "-" ? "" : whatsapp);
  const [draftSource, setDraftSource] = useState(source === "-" ? "" : source);
  const [draftLocation, setDraftLocation] = useState(location === "-" ? "" : location);
  const [draftVehicleType, setDraftVehicleType] = useState(vehicleType === "-" ? "" : vehicleType);
  const [draftBudget, setDraftBudget] = useState(budget === "0" ? "" : budget);
  const [draftStage, setDraftStage] = useState(stage || "new_lead");
  const [draftFollowUpAt, setDraftFollowUpAt] = useState(toDateTimeInput(followUpAt));
  const [conversationNotes, setConversationNotes] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const busy = isSaving || isWinning || isDeleting;

  async function saveLead() {
    setError("");
    setIsSaving(true);

    let screenshotUrl = "";

    if (screenshotFile) {
      const formData = new FormData();
      formData.append("file", screenshotFile);

      const uploadRes = await fetch("/api/erp/upload", {
        body: formData,
        method: "POST",
      });
      const uploadPayload = (await uploadRes.json()) as { error?: string; url?: string };

      if (!uploadRes.ok) {
        setError(uploadPayload.error ?? "Failed to upload screenshot.");
        setIsSaving(false);
        return;
      }
      screenshotUrl = uploadPayload.url ?? "";
    }

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "leads",
        values: {
          budget: draftBudget,
          conversation_notes: conversationNotes,
          location: draftLocation,
          name: draftName,
          next_follow_up_at: draftFollowUpAt,
          phone: draftPhone,
          screenshot_url: screenshotUrl,
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

  async function deleteLead() {
    setError("");
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({ id, moduleKey: "leads" }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: string };

    setIsDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to delete this lead.");
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
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:border-red-300 disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={() => setShowDeleteConfirm(true)}
          title={`Delete ${name}`}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : <Trash className="size-3" />}
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash className="size-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Delete Lead?</h3>
            <p className="mb-6 text-[13px] font-medium text-gray-500">
              Are you absolutely sure you want to delete <strong className="text-gray-900">{name}</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-[12px] border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:ring-4 focus:ring-gray-100"
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-[12px] bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 focus:ring-4 focus:ring-red-600/20"
                onClick={deleteLead}
                type="button"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-xs font-bold text-red-600">{error}</div>}

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
              Total Cost
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
            {draftStage !== "new_lead" && (
              <div className="mt-1 rounded-lg border border-[#e0e0e0] bg-[#fafafa] p-3 shadow-inner">
                <label className="text-xs font-bold text-black animate-[fadeIn_0.3s_ease-in-out] block mb-3">
                  What was discussed?
                  <textarea
                    className="mt-1 w-full rounded-[6px] border border-[#d2d2d2] p-2 text-xs font-medium outline-none focus:border-black bg-white"
                    onChange={(e) => setConversationNotes(e.target.value)}
                    placeholder="Enter conversation notes here..."
                    rows={3}
                    value={conversationNotes}
                  />
                </label>
                <label className="text-xs font-bold text-black animate-[fadeIn_0.3s_ease-in-out] block">
                  Screenshot (Optional)
                  <input
                    accept="image/*"
                    className="mt-1 w-full text-xs file:mr-4 file:rounded-[6px] file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:cursor-pointer hover:file:bg-[#343434]"
                    onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
              </div>
            )}
            <label className="text-xs font-bold text-black">
              Next Follow-up Date & Time
              <DateTimePicker
                className="mt-1 h-9 text-xs"
                onChange={setDraftFollowUpAt}
                value={draftFollowUpAt}
              />
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
