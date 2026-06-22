"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import type { CreateConfig } from "@/lib/create-config";
import { LoadingSpinner } from "./loading-spinner";
import { DateTimePicker } from "./date-time-picker";
import { VehicleSelector } from "./vehicle-selector";

type CreateRecordFormProps = {
  config: CreateConfig;
  onSuccess?: () => void;
};

type TechnicianOption = {
  active: boolean;
  cities: string;
  deviceCount: number;
  id: string;
  name: string;
};

type CustomerOption = {
  id: string;
  label: string;
  name: string;
};

export function CreateRecordForm({ config, onSuccess }: CreateRecordFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [selectedStage, setSelectedStage] = useState("new_lead");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [conversationNotes, setConversationNotes] = useState("");
  const needsCustomers = config.fields.some((field) => field.type === "customer-select");
  const needsTechnicians = config.fields.some((field) => field.type === "technician-select") || config.moduleKey === "leads";
  
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          
          if (!rows.length) {
            setError("CSV file is empty.");
            setLoading(false);
            return;
          }

          // Normalize keys if needed, but for now expect exact matches with config field names
          const response = await fetch("/api/erp/bulk-create", {
            body: JSON.stringify({
              moduleKey: config.moduleKey,
              records: rows,
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          
          const result = await response.json() as { error?: string, ok?: boolean, count?: number };
          
          setLoading(false);
          
          if (!response.ok || result.error) {
            setError(result.error ?? "Unable to import CSV records.");
            return;
          }

          setSuccess(`Successfully imported ${result.count} records!`);
          if (onSuccess) onSuccess();
          router.refresh();
        } catch (err) {
          setError(String(err));
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      }
    });
    
    // reset input
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

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

  useEffect(() => {
    if (!needsCustomers) {
      return;
    }

    let ignore = false;

    async function loadCustomers() {
      const response = await fetch("/api/erp/options/customers", { cache: "no-store" });
      const payload = (await response.json()) as {
        customers?: CustomerOption[];
      };

      if (!ignore) {
        setCustomers(payload.customers ?? []);
      }
    }

    void loadCustomers();

    return () => {
      ignore = true;
    };
  }, [needsCustomers]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    let screenshotUrl = "";

    if (screenshotFile && config.moduleKey === "leads" && selectedStage !== "new_lead") {
      const uploadFormData = new FormData();
      uploadFormData.append("file", screenshotFile);

      const uploadRes = await fetch("/api/erp/upload", {
        body: uploadFormData,
        method: "POST",
      });
      const uploadPayload = (await uploadRes.json()) as { error?: string; url?: string };

      if (!uploadRes.ok) {
        setError(uploadPayload.error ?? "Failed to upload screenshot.");
        setLoading(false);
        return;
      }
      screenshotUrl = uploadPayload.url ?? "";
    }

    const values: Record<string, unknown> = {};

    for (const field of config.fields) {
      if (field.type === "checkbox") {
        values[field.name] = formData.get(field.name) === "on";
      } else if (field.type === "datetime-local") {
        const rawVal = formData.get(field.name)?.toString() ?? "";
        values[field.name] = rawVal ? new Date(rawVal).toISOString() : "";
      } else {
        values[field.name] = formData.get(field.name)?.toString() ?? "";
      }
    }

    if (config.moduleKey === "leads") {
      const locationVal = String(values.location || "").toLowerCase().trim();
      if (locationVal) {
        const cityMatch = technicians.some((tech) => {
          if (!tech.active || !tech.cities) return false;
          const techCities = tech.cities.split(",").map((c) => c.trim().toLowerCase());
          return techCities.some((c) => locationVal.includes(c) || c.includes(locationVal));
        });

        if (!cityMatch) {
          setError("Add first a technician of that city. Currently no technician found for this city.");
          setLoading(false);
          return;
        }
      }
    }

    if (config.moduleKey === "leads" && selectedStage !== "new_lead") {
      values.conversation_notes = conversationNotes;
      values.screenshot_url = screenshotUrl;
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
      // Do NOT reset the form — keep all filled values so the user can correct only what's wrong
      return;
    }

    setSuccess("Record saved.");
    formRef.current?.reset();
    if (onSuccess) {
      onSuccess();
    }
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-[24px] border border-gray-100/50 bg-white/70 bg-gradient-to-b from-white/60 to-gray-50/30 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl">
      <div className="mb-8">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">Create New Record</h3>
        <p className="mt-1 text-sm text-gray-500">Fill in the details below to add a new entry to the system.</p>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-x-8 gap-y-8 md:grid-cols-2">
      {config.fields.map((field, index) => (
        <label 
          className="group relative block animate-[slideUpFade_0.6s_ease-out_both]" 
          key={field.name}
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-gray-700 transition-all duration-300 group-focus-within:text-[#FAC54D]">{field.label}</span>
          {field.type === "select" ? (
            <select
              className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
              defaultValue={field.options?.[0] ?? ""}
              name={field.name}
              required={field.required}
              onChange={(e) => {
                if (config.moduleKey === "leads" && field.name === "stage") {
                  setSelectedStage(e.target.value);
                }
              }}
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : field.type === "vehicle-selector" ? (
            <VehicleSelector name={field.name} />
          ) : field.type === "customer-select" ? (
            <select
              className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
              defaultValue=""
              name={field.name}
              required={field.required}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          ) : field.type === "technician-select" ? (
            <select
              className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
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
            <span className="flex h-14 cursor-pointer items-center gap-4 rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm transition-all duration-300 hover:border-gray-400">
              <input className="size-6 cursor-pointer accent-[#FAC54D] transition-transform duration-200 hover:scale-110" name={field.name} type="checkbox" />
              Yes
            </span>
          ) : field.type === "datetime-local" ? (
            <DateTimePicker
              className="h-14 w-full cursor-pointer rounded-[14px] border-2 border-gray-300 bg-white px-5 pr-10 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
              name={field.name}
              required={field.required}
            />
          ) : (
            <input
              className="h-14 w-full rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
              name={field.name}
              required={field.required}
              step={field.type === "number" ? "0.01" : undefined}
              type={field.type}
            />
          )}
        </label>
      ))}

      {config.moduleKey === "leads" && selectedStage !== "new_lead" && (
        <div className="md:col-span-2 grid gap-x-8 gap-y-6 md:grid-cols-2 rounded-[20px] bg-[#FAC54D]/5 border-2 border-[#FAC54D]/30 p-8 shadow-md">
          <label className="group relative block animate-[slideUpFade_0.4s_ease-out_both]">
            <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-[#b58b29] transition-all duration-300 group-focus-within:text-gray-900">What was discussed?</span>
            <textarea
              className="h-32 w-full rounded-[14px] border-2 border-gray-300 bg-white p-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
              onChange={(e) => setConversationNotes(e.target.value)}
              placeholder="Enter conversation notes here..."
              value={conversationNotes}
            />
          </label>
          <label className="group relative block animate-[slideUpFade_0.4s_ease-out_both]">
            <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-[#b58b29] transition-all duration-300 group-focus-within:text-gray-900">Screenshot (Optional)</span>
            <input
              accept="image/*"
              className="mt-1 w-full text-sm file:mr-4 file:cursor-pointer file:rounded-[10px] file:border-0 file:bg-[#FAC54D] file:px-6 file:py-3 file:text-sm file:font-bold file:text-gray-900 file:shadow-md file:transition-all file:duration-300 hover:file:bg-[#e0b040] hover:file:shadow-lg hover:file:-translate-y-0.5 font-bold text-gray-700"
              onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>
      )}

      <div className="mt-8 md:col-span-2 flex items-center justify-between border-t-2 border-gray-50 pt-8">
        <div className="flex-1">
          {error || success ? (
            <div className={`mr-6 inline-flex animate-[slideUpFade_0.3s_ease-out] items-center gap-3 rounded-2xl px-5 py-3.5 text-[15px] font-bold ${error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
              {error ? "⚠️ " : "✨ "}
              {error || success}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {(config.moduleKey === "inventory" || config.moduleKey === "technicians") && (
            <>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={csvInputRef} 
                onChange={handleCsvImport} 
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={loading}
                className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white border-2 border-gray-200 px-8 text-[15px] font-bold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? <LoadingSpinner /> : null}
                <span className="relative">Import CSV</span>
              </button>
            </>
          )}
          <button
            className="group relative inline-flex h-14 min-w-[180px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#FAC54D] px-8 text-[15px] font-bold text-gray-900 shadow-[0_8px_20px_-8px_rgba(250,197,77,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_25px_-8px_rgba(250,197,77,0.6)] hover:bg-[#e0b040] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
            disabled={loading}
          type="submit"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {loading ? <LoadingSpinner /> : null}
          <span className="relative">{loading ? "Processing..." : "Save Record"}</span>
        </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </form>
  </div>
  );
}
