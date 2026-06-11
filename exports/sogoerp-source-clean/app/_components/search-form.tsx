"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "./loading-spinner";

type SearchFormProps = {
  query: string;
};

function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-12 items-center justify-center gap-2 rounded-[6px] bg-black px-6 text-sm font-bold text-white disabled:cursor-wait disabled:bg-[#343434]"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoadingSpinner /> : null}
      {pending ? "Searching" : "Search"}
    </button>
  );
}

export function SearchForm({ query }: SearchFormProps) {
  return (
    <form action="/search" className="flex flex-col gap-3 sm:flex-row">
      <input
        className="h-12 flex-1 rounded-[6px] border border-[#d2d2d2] px-4 text-sm text-black outline-none focus:border-black"
        defaultValue={query}
        name="q"
        placeholder="Search by lead, customer, IMEI, SIM, technician..."
        type="search"
      />
      <SearchButton />
    </form>
  );
}
