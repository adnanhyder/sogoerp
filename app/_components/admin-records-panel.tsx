"use client";

import Link from "next/link";
import { Plus, Search, X, Upload, FileDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import type { CreateConfig } from "@/lib/create-config";
import { CreateRecordForm } from "./create-record-form";
import { LoadingSpinner } from "./loading-spinner";

type AdminRecordsPanelProps = {
  actionLabel?: string;
  children: ReactNode;
  config?: CreateConfig;
  eyebrow: string;
  searchAction?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  title: string;
};

function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FAC54D] px-6 text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 hover:bg-[#e0b040] hover:shadow-md disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoadingSpinner className="size-4" /> : <Search className="size-4" />}
      {pending ? "Searching" : "Search"}
    </button>
  );
}

export function AdminRecordsPanel({
  actionLabel,
  children,
  config,
  eyebrow,
  searchAction,
  searchPlaceholder = "Search records...",
  searchQuery = "",
  title,
}: AdminRecordsPanelProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);

  const handleDownloadSample = (format: "csv" | "pdf") => {
    const moduleKey = config?.moduleKey;
    if (!moduleKey) return;

    let headers: string[] = [];
    let rows: string[][] = [];
    let docTitle = "";

    if (moduleKey === "inventory") {
      docTitle = "GPS Devices Import Template";
      headers = ["imei", "status", "custody_status", "purchase_cost", "has_mic", "device_condition"];
      rows = [
        ["865742091234567", "approved", "company_hands", "1500", "true", "new"],
        ["865742091234568", "approved", "company_hands", "1500", "false", "new"]
      ];
    } else if (moduleKey === "technicians") {
      docTitle = "Technicians Import Template";
      headers = [
        "name", "cnic", "phone", "area_coverage", "cities", "commission_rate",
        "authorization_person_name", "authorization_person_phone", "authorization_person_cnic", "authorization_relation"
      ];
      rows = [
        ["Ali Raza", "42101-1234567-1", "0300-1234567", "Johar / Gulshan", "Karachi", "12", "Muhammad Raza", "0333-1234567", "42101-7654321-1", "Father"],
        ["Hamza Field", "42101-2345678-1", "0300-2345678", "Korangi", "Karachi", "10", "Ayesha Bibi", "0333-2345678", "42101-8765432-1", "Mother"]
      ];
    }

    if (format === "csv") {
      const csvString = [
        headers.join(","),
        ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${moduleKey}_sample_template.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            h1 { font-size: 22px; font-weight: bold; margin-bottom: 8px; color: #000; }
            p { font-size: 14px; color: #666; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d2d2d2; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #fbfbfb; font-weight: bold; color: #343434; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
            .note { margin-top: 30px; padding: 15px; background-color: #fdfaf2; border: 1px solid #faecc5; border-radius: 6px; font-size: 13px; color: #7d5a00; }
          </style>
        </head>
        <body>
          <h1>${docTitle}</h1>
          <p>This is a sample structure for bulk CSV imports. You can save this page as a PDF using the browser print option.</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(val => `<td>${val}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="note">
            <strong>Important Note:</strong> Ensure the CSV file you upload contains exactly the column names (headers) shown above, and format all cells accordingly.
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    setCsvError("");
    setCsvSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          
          if (!rows.length) {
            setCsvError("CSV file is empty.");
            setCsvLoading(false);
            return;
          }

          const response = await fetch("/api/erp/bulk-create", {
            body: JSON.stringify({
              moduleKey: config?.moduleKey,
              records: rows,
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          
          const result = await response.json() as { error?: string, ok?: boolean, count?: number };
          
          setCsvLoading(false);
          
          if (!response.ok || result.error) {
            setCsvError(result.error ?? "Unable to import CSV records.");
            return;
          }

          setCsvSuccess(`Successfully imported ${result.count} records!`);
          router.refresh();
        } catch (err) {
          setCsvError(String(err));
          setCsvLoading(false);
        }
      },
      error: (err) => {
        setCsvError(err.message);
        setCsvLoading(false);
      }
    });
    
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#777777]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-black">{title}</h2>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {searchAction ? (
            <form action={searchAction} className="flex flex-col gap-2 sm:flex-row" method="get">
              <input
                className="h-11 w-full rounded-[12px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20 sm:w-[280px]"
                defaultValue={searchQuery}
                name="q"
                placeholder={searchPlaceholder}
                type="search"
              />
              <SearchButton />
            </form>
          ) : null}

          <div className="flex gap-2">
            {searchAction && searchQuery ? (
              <Link
                className="inline-flex h-11 items-center justify-center rounded-[10px] border-2 border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                href={searchAction}
              >
                Clear
              </Link>
            ) : null}
            {config && (config.moduleKey === "inventory" || config.moduleKey === "technicians") ? (
              <div className="relative">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setShowSampleDropdown(!showSampleDropdown)}
                  type="button"
                >
                  <FileDown className="size-4" />
                  Sample Template
                </button>
                {showSampleDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1 animate-[fadeIn_0.15s_ease-out]" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => {
                          handleDownloadSample("csv");
                          setShowSampleDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Download CSV (Excel)
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadSample("pdf");
                          setShowSampleDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            {config && (config.moduleKey === "inventory" || config.moduleKey === "technicians") ? (
              <>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={csvInputRef} 
                  onChange={handleCsvImport} 
                />
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border-2 border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:cursor-wait disabled:opacity-70"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={csvLoading}
                  type="button"
                >
                  {csvLoading ? <LoadingSpinner className="size-4" /> : <Upload className="size-4" />}
                  Import CSV
                </button>
              </>
            ) : null}
            {config ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-black px-4 text-sm font-bold text-white hover:bg-gray-800"
                onClick={() => setOpen((current) => !current)}
                type="button"
              >
                {open ? <X className="size-4" /> : <Plus className="size-4" />}
                {open ? "Close" : (actionLabel || "Add")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {(csvError || csvSuccess) && (
        <div className={`mb-4 inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-bold ${csvError ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
          {csvError ? "⚠️ " : "✨ "}
          {csvError || csvSuccess}
        </div>
      )}

      {open ? (
        <div className="mb-5 rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfb] p-4">
          {config ? <CreateRecordForm config={config} onSuccess={() => setOpen(false)} /> : null}
        </div>
      ) : null}

      {children}
    </>
  );
}
