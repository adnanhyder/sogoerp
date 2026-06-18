"use client";

import { CalendarClock, Pencil, Trophy, X, Trash } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";
import { AlertModal } from "./alert-modal";

type LeadRecordActionsProps = {
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  assignedDeviceId?: string;
  assignedDeviceImei?: string;
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
  assignedTechnicianId,
  assignedTechnicianName,
  assignedDeviceId,
  assignedDeviceImei,
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
  const searchParams = useSearchParams();
  const openFollowUpsId = searchParams.get("openFollowUps");

  const [error, setError] = useState("");
  // Assignment States
  const [draftTechnicianId, setDraftTechnicianId] = useState(assignedTechnicianId || "");
  const [draftDeviceId, setDraftDeviceId] = useState(assignedDeviceId || "");
  const [draftCustodyStatus, setDraftCustodyStatus] = useState("technician_hands");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [devices, setDevices] = useState<{ id: string; imei: string; technicianName: string; technician_id: string | null }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string; cities: string; deviceCount?: number }[]>([]);

  // Follow-up States
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpNextAt, setFollowUpNextAt] = useState("");
  const [followUpScreenshot, setFollowUpScreenshot] = useState<File | null>(null);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null);

  // Edit States
  const [draftBudget, setDraftBudget] = useState(budget || "");
  const [draftLocation, setDraftLocation] = useState(location || "");
  const [draftName, setDraftName] = useState(name || "");
  const [draftPhone, setDraftPhone] = useState(phone || "");
  const [draftSource, setDraftSource] = useState(source || "");
  const [draftStage, setDraftStage] = useState(stage || "new_lead");
  const [draftVehicleType, setDraftVehicleType] = useState(vehicleType || "");
  const [draftWhatsapp, setDraftWhatsapp] = useState(whatsapp || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const busy = isSavingAssignment || isSavingFollowUp || isSaving || isDeleting;
  const loading = isSavingAssignment || isSavingFollowUp || isSaving;

  const filteredEditTechnicians = technicians.filter(t => {
    if (!t.cities || !draftLocation) return false;
    const techCities = t.cities.toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
    const loc = draftLocation.toLowerCase();
    return techCities.some(city => loc.includes(city) || city.includes(loc));
  });

  // Auto-open modal if specified in search parameters
  useEffect(() => {
    if (openFollowUpsId && openFollowUpsId === id) {
      setIsFollowUpOpen(true);
    }
  }, [openFollowUpsId, id]);

  // Fetch technicians for assignment dropdown
  useEffect(() => {
    fetch("/api/erp/options/technicians")
      .then((r) => r.json())
      .then((payload) => {
        const list = (payload.technicians ?? []) as { id: string; name: string; cities: string; active: boolean; deviceCount: number }[];
        setTechnicians(list.filter((t) => t.active));
      })
      .catch(() => {});
      
    fetch("/api/erp/options/devices")
      .then((r) => r.json())
      .then((payload) => {
        setDevices(payload.devices ?? []);
      })
      .catch(() => {});
  }, []);

  async function fetchFollowUps() {
    setFollowUpsLoading(true);
    try {
      const res = await fetch(`/api/erp/leads/follow-up?leadId=${id}`);
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
    if (isFollowUpOpen) {
      fetchFollowUps();
      // Mark all follow-ups for this lead as read
      fetch("/api/erp/notifications/mark-lead-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      }).catch((err) => console.error("Error marking lead follow-ups as seen:", err));
    }
  }, [isFollowUpOpen, id]);

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
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
      let finalScreenshotUrl = "";
      if (followUpScreenshot) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", followUpScreenshot);
        const uploadRes = await fetch("/api/erp/upload", {
          method: "POST",
          body: uploadFormData,
        });
        if (!uploadRes.ok) {
          const payload = await uploadRes.json();
          setError(payload.error ?? "Failed to upload screenshot.");
          setIsSavingFollowUp(false);
          return;
        }
        const uploadPayload = await uploadRes.json();
        finalScreenshotUrl = uploadPayload.url ?? "";
      }

      const res = await fetch("/api/erp/leads/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: id,
          reason: followUpReason,
          notes: followUpNotes,
          nextFollowUpAt: followUpNextAt ? new Date(followUpNextAt).toISOString() : "",
          screenshotUrl: finalScreenshotUrl,
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
      setFollowUpScreenshot(null);
      await fetchFollowUps();
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSavingFollowUp(false);
    }
  }

  async function deleteLead() {
    setError("");
    setIsDeleting(true);

    const response = await fetch("/api/erp/delete", {
      body: JSON.stringify({ id, moduleKey: "leads" }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });

    setIsDeleting(false);

    if (!response.ok) {
      setError("Unable to delete lead.");
      return;
    }

    router.refresh();
  }

  async function saveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftName) {
      setError("Name is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "leads",
        values: {
          budget: draftBudget ? Number(draftBudget) : null,
          location: draftLocation,
          name: draftName,
          phone: draftPhone,
          source: draftSource,
          stage: draftStage,
          vehicle_type: draftVehicleType,
          whatsapp: draftWhatsapp,
          assigned_technician_id: draftTechnicianId || null,
          assigned_device_id: draftDeviceId || null,
          assigned_device_custody_status: draftCustodyStatus,
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update lead.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function saveAssignment() {
    setError("");
    setIsSavingAssignment(true);

    const response = await fetch("/api/erp/update", {
      body: JSON.stringify({
        id,
        moduleKey: "leads",
        values: {
          assigned_technician_id: draftTechnicianId || null,
          assigned_device_id: draftDeviceId || null,
          assigned_device_custody_status: draftCustodyStatus,
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as { error?: string };

    setIsSavingAssignment(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update assignment.");
      return;
    }

    if (draftTechnicianId && draftDeviceId) {
      setIsFollowUpOpen(false);
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
            setIsEditing(true);
          }}
          type="button"
          title="Edit Lead"
        >
          <Pencil className="size-3" />
          Edit
        </button>

        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-xs font-bold text-black transition hover:border-black disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={() => {
            setError("");
            setIsFollowUpOpen(true);
          }}
          type="button"
        >
          <CalendarClock className="size-3" />
          Follow-up & Assign
        </button>
        
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] bg-[#fee2e2] px-3 text-xs font-bold text-[#dc2626] transition hover:bg-[#fecaca] disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={deleteLead}
          type="button"
          title="Delete Lead"
        >
          <Trash className="size-3" />
        </button>
      </div>

      {error && <div className="text-xs font-bold text-red-600">{error}</div>}

      {isEditing ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[650px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Edit Lead</h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">Update information for {name}</p>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
        <form className="mt-4 flex flex-col gap-4" onSubmit={saveChanges}>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Lead Name *</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftName(event.target.value)}
              required
              type="text"
              value={draftName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Phone</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftPhone(event.target.value)}
              type="text"
              value={draftPhone}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">WhatsApp</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftWhatsapp(event.target.value)}
              type="text"
              value={draftWhatsapp}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Source</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftSource(event.target.value)}
              type="text"
              value={draftSource}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Location / Area</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftLocation(event.target.value)}
              type="text"
              value={draftLocation}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Vehicle Type</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftVehicleType(event.target.value)}
              type="text"
              value={draftVehicleType}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Total Cost (Budget)</span>
            <input
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftBudget(event.target.value)}
              type="number"
              value={draftBudget}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Assigned Technician</span>
            <select
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftTechnicianId(event.target.value)}
              value={draftTechnicianId}
            >
              <option value="">-- Unassigned --</option>
              {filteredEditTechnicians.length > 0 ? (
                filteredEditTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.cities})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  ⚠️ No technician found for this city. Please add a technician first.
                </option>
              )}
            </select>
            {filteredEditTechnicians.length === 0 && draftLocation && (
              <span className="text-[11px] font-bold text-amber-600 mt-1">
                ⚠️ No technician found for city: &quot;{draftLocation}&quot;. Please register a technician for this city first under Technician Operations.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-black">Assign Device (IMEI)</span>
            <select
              className="h-9 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-semibold text-black outline-none transition focus:border-black"
              onChange={(event) => setDraftDeviceId(event.target.value)}
              value={draftDeviceId}
            >
              <option value="">-- Unassigned --</option>
              {assignedDeviceId ? (
                <option value={assignedDeviceId}>{assignedDeviceImei} (Current)</option>
              ) : null}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.imei} {d.technicianName ? `(${d.technicianName})` : "(Unassigned)"}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-[#ebebeb] pt-4">
            <button
              className="h-9 rounded-[6px] px-4 text-xs font-bold text-[#777777] transition hover:text-black"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-4 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <LoadingSpinner className="size-3" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
          </div>
        </div>
      ) : null}

      {isFollowUpOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[650px] rounded-[24px] bg-white p-8 shadow-2xl animate-[slideUpFade_0.3s_ease-out_both] max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Follow-up Log</h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">Notes and schedule for this lead</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    <span className="size-2 rounded-full bg-[#FAC54D]" />
                    Client: {name}
                  </span>
                  {assignedTechnicianName ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Technician: {assignedTechnicianName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                      <span className="size-2 rounded-full bg-red-400" />
                      No technician assigned
                    </span>
                  )}
                </div>
              </div>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
                onClick={() => setIsFollowUpOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

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

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Screenshot (Optional)</span>
                <input
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-[12px] file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFollowUpScreenshot(file);
                    else setFollowUpScreenshot(null);
                  }}
                />
              </label>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FAC54D] px-8 text-sm font-bold text-gray-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-lg focus:ring-4 focus:ring-[#FAC54D]/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSavingFollowUp ? <LoadingSpinner className="size-4" /> : null}
                  {isSavingFollowUp ? "Logging..." : "Log Follow-up"}
                </button>
              </div>
            </form>

            <div className="my-6 h-px bg-gray-100" />

            {/* Assignment Section */}
            {(() => {
              const localTechnicians = technicians.filter(t => {
                if (!t.cities || !location) return false;
                const techCities = t.cities.toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
                const loc = location.toLowerCase();
                return techCities.some(city => loc.includes(city) || city.includes(loc));
              });
              
              return (
                <div>
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4">
                    Assign Technician & Device
                  </h4>
                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assigned Technician</span>
                      <select
                        className="h-12 w-full appearance-none rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        onChange={(event) => setDraftTechnicianId(event.target.value)}
                        value={draftTechnicianId}
                      >
                        <option value="">-- Unassigned --</option>
                        {localTechnicians.length > 0 ? (
                          <optgroup label="📍 Local Technicians">
                            {localTechnicians.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.deviceCount || 0} Devices)
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option value="" disabled>
                            ⚠️ No technician found for this city. Please add a technician first.
                          </option>
                        )}
                      </select>
                      {localTechnicians.length === 0 && (
                        <p className="mt-2 text-[11px] font-bold text-amber-600">
                          ⚠️ No technician found for city: &quot;{location}&quot;. Please register a technician for this city first under Technician Operations.
                        </p>
                      )}
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assign Device (IMEI)</span>
                      <select
                        className="h-12 w-full appearance-none rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                        onChange={(event) => setDraftDeviceId(event.target.value)}
                        value={draftDeviceId}
                      >
                        <option value="">-- Unassigned --</option>
                        {assignedDeviceId ? (
                          <option value={assignedDeviceId}>{assignedDeviceImei} (Current)</option>
                        ) : null}
                        {devices
                          .filter(d => draftTechnicianId ? (d.technician_id === draftTechnicianId || !d.technician_id) : true)
                          .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.imei} {d.technician_id ? `(Held by ${d.technicianName})` : "(Office Stock)"}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(() => {
                      const selectedDevice = devices.find((d) => d.id === draftDeviceId);
                      if (selectedDevice && !selectedDevice.technician_id) {
                        return (
                          <label className="block sm:col-span-2">
                            <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Device Custody Status</span>
                            <select
                              className="h-12 w-full appearance-none rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
                              onChange={(event) => setDraftCustodyStatus(event.target.value)}
                              value={draftCustodyStatus}
                            >
                              <option value="technician_hands">Received by Technician</option>
                              <option value="on_the_way">On the Way</option>
                            </select>
                          </label>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveAssignment}
                      disabled={busy}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-black px-8 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#343434] hover:shadow-lg focus:ring-4 focus:ring-black/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                      type="button"
                    >
                      {isSavingAssignment ? <LoadingSpinner className="size-4" /> : null}
                      {isSavingAssignment ? "Saving..." : "Save Assignment"}
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="my-6 h-px bg-gray-100" />

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
                      {!item.seen ? (
                        <span className="absolute right-4 top-4 rounded-full bg-[#FAC54D]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gray-800">
                          New / Due
                        </span>
                      ) : null}
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
                      <div className="text-[10px] text-right font-semibold text-gray-400 group-hover:text-gray-900 mt-2 transition-colors">
                        Click to view details →
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

              {selectedFollowUp.screenshot_url ? (
                <div>
                  <span className="mb-1.5 block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Attached Screenshot</span>
                  <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-2 overflow-hidden flex justify-center">
                    <img src={selectedFollowUp.screenshot_url} alt="Follow-up Screenshot" className="max-h-[250px] object-contain rounded-[8px]" />
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

      {error ? <p className="max-w-[240px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
