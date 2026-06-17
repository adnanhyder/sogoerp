"use client";

import { CalendarClock, Pencil, Trophy, X, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";
import { AlertModal } from "./alert-modal";

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

      <AlertModal
        cancelText="Cancel"
        confirmText="Yes, Delete"
        description={
          <>
            Are you absolutely sure you want to delete <strong className="text-gray-900">{name}</strong>? This action is permanent and cannot be undone.
          </>
        }
        isLoading={isDeleting}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteLead}
        title="Delete Lead?"
        type="delete"
      />

      {error && <div className="text-xs font-bold text-red-600">{error}</div>}

      {isEditing ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[600px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Lead</h3>
                <p className="text-sm text-gray-500 font-medium">Update the details for {name}</p>
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
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Lead Name</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftName(event.target.value)} value={draftName} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Phone</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftPhone(event.target.value)} value={draftPhone} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">WhatsApp</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftWhatsapp(event.target.value)} value={draftWhatsapp} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Source</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftSource(event.target.value)} value={draftSource} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Location / Area</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftLocation(event.target.value)} value={draftLocation} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Vehicle Type</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftVehicleType(event.target.value)} value={draftVehicleType} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Total Cost</span>
                <input className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftBudget(event.target.value)} step="0.01" type="number" value={draftBudget} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Stage</span>
                <select className="h-12 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20" onChange={(event) => setDraftStage(event.target.value)} value={draftStage}>
                  {stageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              
              {draftStage !== "new_lead" && (
                <div className="sm:col-span-2 rounded-[16px] border-2 border-[#FAC54D]/30 bg-[#FAC54D]/5 p-5 animate-[slideUpFade_0.3s_ease-out_both]">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-[#b58b29] uppercase tracking-wider">What was discussed?</span>
                      <textarea
                        className="h-24 w-full rounded-[12px] border-2 border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        onChange={(e) => setConversationNotes(e.target.value)}
                        placeholder="Enter conversation notes here..."
                        value={conversationNotes}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-[#b58b29] uppercase tracking-wider">Screenshot (Optional)</span>
                      <input
                        accept="image/*"
                        className="w-full text-sm file:mr-4 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#FAC54D] file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-gray-900 file:transition-all hover:file:bg-[#e0b040] font-bold text-gray-700"
                        onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                    </label>
                  </div>
                </div>
              )}
              
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Next Follow-up Date & Time</span>
                <DateTimePicker
                  className="h-12 w-full rounded-[12px] border-2 border-gray-200 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                  onChange={setDraftFollowUpAt}
                  value={draftFollowUpAt}
                />
              </label>
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
                onClick={saveLead}
                type="button"
              >
                {isSaving ? <LoadingSpinner className="size-4" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[240px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
