import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  currentPage: number;
  pageSize: number;
  path: string;
  totalItems: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
};

function pageItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  sortedPages.forEach((page, index) => {
    const previous = sortedPages[index - 1];

    if (previous && page - previous > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

export function paginationHref(path: string, page: number, query: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function PaginationControls({
  currentPage,
  pageSize,
  path,
  query = {},
  totalItems,
  totalPages,
}: PaginationControlsProps) {
  if (totalPages <= 1 || totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-[16px] border border-gray-200 bg-[#fbfbfb] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="px-1">
        <p className="text-sm font-black text-gray-900">
          Page {currentPage} of {totalPages}
        </p>
        <p className="mt-0.5 text-xs font-bold text-gray-500">
          Showing {(currentPage - 1) * pageSize + 1}
          {"-"}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[12px] border border-gray-200 bg-white p-1 shadow-inner">
        {currentPage > 1 ? (
          <Link
            className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] px-3 text-xs font-black text-gray-700 transition hover:bg-gray-100 hover:text-black"
            href={paginationHref(path, currentPage - 1, query)}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
        ) : (
          <span className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1 rounded-[8px] px-3 text-xs font-black text-gray-300">
            <ChevronLeft className="size-4" />
            Prev
          </span>
        )}
        <div className="mx-1 h-6 w-px bg-gray-100" />
        {pageItems(currentPage, totalPages).map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span className="inline-flex size-9 items-center justify-center text-xs font-black text-gray-400" key={`ellipsis-${index}`}>
                ...
              </span>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`inline-flex size-9 items-center justify-center rounded-[8px] text-xs font-black transition ${
                isCurrent ? "bg-black text-white shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-black"
              }`}
              href={paginationHref(path, item, query)}
              key={item}
            >
              {item}
            </Link>
          );
        })}
        <div className="mx-1 h-6 w-px bg-gray-100" />
        {currentPage < totalPages ? (
          <Link
            className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] px-3 text-xs font-black text-gray-700 transition hover:bg-gray-100 hover:text-black"
            href={paginationHref(path, currentPage + 1, query)}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1 rounded-[8px] px-3 text-xs font-black text-gray-300">
            Next
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
