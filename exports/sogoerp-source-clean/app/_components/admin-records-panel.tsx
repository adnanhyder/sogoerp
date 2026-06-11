"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { CreateConfig } from "@/lib/create-config";
import { CreateRecordForm } from "./create-record-form";
import { LoadingSpinner } from "./loading-spinner";

type AdminRecordsPanelProps = {
  actionLabel: string;
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
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-black px-4 text-sm font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
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
                className="h-11 w-full rounded-[6px] border border-[#d2d2d2] bg-white px-3 text-sm text-black outline-none placeholder:text-[#999999] focus:border-black sm:w-[280px]"
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
                className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-sm font-bold text-black"
                href={searchAction}
              >
                Clear
              </Link>
            ) : null}
            {config ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-black px-4 text-sm font-bold text-white"
                onClick={() => setOpen((current) => !current)}
                type="button"
              >
                {open ? <X className="size-4" /> : <Plus className="size-4" />}
                {open ? "Close" : actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className="mb-5 rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfb] p-4">
          {config ? <CreateRecordForm config={config} /> : null}
        </div>
      ) : null}

      {children}
    </>
  );
}
