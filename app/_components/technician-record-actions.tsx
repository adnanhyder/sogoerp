"use client";

import { Ban, Pencil, ShieldAlert, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

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
  id: string;
  name: string;
  phone: string;
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
  id,
  name,
  phone,
}: TechnicianRecordActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isTogglingDispute, setIsTogglingDispute] = useState(false);
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

  async function toggleDispute() {
    setError("");
    setIsTogglingDispute(true);

    try {
      await updateTechnician({ disputed: !disputed });
      router.refresh();
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Unable to update dispute status.");
    } finally {
      setIsTogglingDispute(false);
    }
  }

  async function deleteRecord() {
    const shouldDelete = window.confirm(`Delete technician ${name}?`);

    if (!shouldDelete) {
      return;
    }

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
          onClick={toggleDispute}
          type="button"
        >
          {isTogglingDispute ? <LoadingSpinner className="size-3" /> : <ShieldAlert className="size-3" />}
          {disputed ? "Clear" : "Dispute"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-black px-3 py-2 text-xs font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:opacity-50"
          disabled={busy}
          onClick={deleteRecord}
          type="button"
        >
          {isDeleting ? <LoadingSpinner className="size-3" /> : <Trash2 className="size-3" />}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>

      {isEditing ? (
        <div className="w-[320px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
          <div className="grid gap-2">
            {editFields.map(([label, value, setter, type]) => (
              <label className="text-xs font-bold text-black" key={label}>
                {label}
                <input
                  className="mt-1 h-9 w-full rounded-[6px] border border-[#d2d2d2] px-2 text-xs font-medium outline-none focus:border-black"
                  onChange={(event) => setter(event.target.value)}
                  type={type}
                  value={value}
                />
              </label>
            ))}
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-black px-3 text-xs font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
              disabled={busy}
              onClick={saveRecord}
              type="button"
            >
              {isSaving ? <LoadingSpinner className="size-3" /> : null}
              {isSaving ? "Saving" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="max-w-[260px] text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
