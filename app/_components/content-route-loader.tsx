"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "./loading-spinner";

type ContentRouteLoaderProps = {
  children: ReactNode;
};

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function ContentRouteLoader({ children }: ContentRouteLoaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 0);

    return () => window.clearTimeout(timer);
  }, [routeKey]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]");

      if (!link || !(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (link.target || link.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(link.href, window.location.href);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const sameRoute =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (sameRoute) {
        return;
      }

      setLoading(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <div className="relative min-h-full">
      {children}
      {loading ? (
        <div className="absolute inset-0 z-20 grid min-h-[260px] place-items-center rounded-[8px] bg-[#fbfbfb]/82 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-[8px] border border-[#d2d2d2] bg-white px-5 py-4 text-sm font-bold text-black shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
            <LoadingSpinner className="size-5" />
            Loading page
          </div>
        </div>
      ) : null}
    </div>
  );
}
