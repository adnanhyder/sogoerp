"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreateConfig } from "@/lib/create-config";
import { LoadingSpinner } from "./loading-spinner";

type CreateRecordFormProps = {
  config: CreateConfig;
};

type TechnicianOption = {
  active: boolean;
  cities: string;
  deviceCount: number;
  id: string;
  name: string;
};

export function CreateRecordForm({ config }: CreateRecordFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const needsTechnicians = config.fields.some((field) => field.type === "technician-select");

  useEffect(() => {
    if (!needsTechnicians) {
      return;
    }

    let ignore = false;

    async function loadTechnicians() {
      const response = await fetch("/api/erp/options/technicians", { cache: "no-store" });
      const payload = (await response.json()) as {
        technicians?: TechnicianOption[];
      };

      if (!ignore) {
        setTechnicians(payload.technicians ?? []);
      }
    }

    void loadTechnicians();

    return () => {
      ignore = true;
    };
  }, [needsTechnicians]);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    setLoading(true);

    const values: Record<string, unknown> = {};

    for (const field of config.fields) {
      if (field.type === "checkbox") {
        values[field.name] = formData.get(field.name) === "on";
      } else {
        values[field.name] = formData.get(field.name)?.toString() ?? "";
      }
    }

    const response = await fetch("/api/erp/create", {
      body: JSON.stringify({
        moduleKey: config.moduleKey,
        values,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string; ok?: boolean };

    setLoading(false);

    if (!response.ok || result.error) {
      setError(result.error ?? "Unable to create record.");
      return;
    }

    setSuccess("Record saved.");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-2">
      {config.fields.map((field) => (
        <label className="block" key={field.name}>
          <span className="mb-2 block text-sm font-semibold text-black">{field.label}</span>
          {field.type === "select" ? (
            <select
              className="h-11 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm text-black outline-none focus:border-black"
              defaultValue={field.options?.[0] ?? ""}
              name={field.name}
              required={field.required}
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : field.type === "technician-select" ? (
            <select
              className="h-11 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm text-black outline-none focus:border-black"
              defaultValue=""
              name={field.name}
              required={field.required}
            >
              <option value="">No technician selected</option>
              {technicians.map((technician) => (
                <option disabled={!technician.active} key={technician.id} value={technician.id}>
                  {technician.name} / {technician.cities || "No city"} / {technician.deviceCount} devices
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <span className="flex h-11 items-center gap-2 rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm font-medium text-[#343434]">
              <input className="size-4 accent-black" name={field.name} type="checkbox" />
              Yes
            </span>
          ) : (
            <input
              className="h-11 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm text-black outline-none placeholder:text-[#999999] focus:border-black"
              name={field.name}
              required={field.required}
              step={field.type === "number" ? "0.01" : undefined}
              type={field.type}
            />
          )}
        </label>
      ))}

      <div className="md:col-span-2">
        {error || success ? (
          <p className="mb-3 rounded-[6px] border border-[#d2d2d2] bg-[#fbfbfb] px-4 py-3 text-sm font-semibold text-black">
            {error || success}
          </p>
        ) : null}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
          disabled={loading}
          type="submit"
        >
          {loading ? <LoadingSpinner /> : null}
          {loading ? "Processing record" : "Save Record"}
        </button>
      </div>
    </form>
  );
}
