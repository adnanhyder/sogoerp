"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { erpModules } from "@/lib/erp-data";
import { BrandLogo } from "./brand-logo";
import { ContentRouteLoader } from "./content-route-loader";
import { HeaderActions } from "./header-actions";


type ErpShellProps = {
  activeHref: string;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  user: User;
};

const hiddenAsideHrefs = new Set([
  "/sim-config",
  "/finance",
  "/commissions",
  "/whatsapp",
  "/support",
  "/insurance",
  "/reports",
  "/documents",
  "/tracking",
  "/integrations",
  "/settings",
]);

function Logo() {
  return <BrandLogo />;
}

export function ErpShell({
  activeHref,
  children,
  eyebrow = "GPS Tracking ERP",
  title,
  user,
}: ErpShellProps) {
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Admin";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isReportsOpen, setIsReportsOpen] = useState(() => {
    return (
      activeHref.startsWith("/inventory/") &&
      ["/inventory/in-stock", "/inventory/on-way", "/inventory/received", "/inventory/installed"].includes(activeHref)
    );
  });

  return (
    <main className="min-h-screen bg-white">
      <section className="flex min-h-screen w-full bg-white">
        <aside className="sticky top-0 hidden h-screen w-[276px] shrink-0 border-r border-[#d2d2d2] bg-white lg:flex lg:flex-col">
          <div className="px-8 pb-8 pt-8">
            <Logo />
          </div>

          <nav className="flex-1 overflow-y-auto pb-5">
            <p className="px-8 pb-3 text-sm font-medium text-[#343434]">Modules</p>
            <div className="space-y-1">
              {erpModules.filter((item) => !hiddenAsideHrefs.has(item.href)).map((item) => {
                const Icon = item.icon;
                const active = item.href === activeHref;

                const isInventoryReportActive =
                  activeHref.startsWith("/inventory/") &&
                  ["/inventory/in-stock", "/inventory/on-way", "/inventory/received", "/inventory/installed"].includes(activeHref);

                return (
                  <div key={item.href} className="flex flex-col">
                    <Link
                      className={`relative flex min-h-12 items-center gap-4 px-8 py-3 text-sm transition ${
                        active
                          ? "bg-black font-semibold text-white"
                          : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                      }`}
                      href={item.href}
                    >
                      {active ? (
                        <span className="absolute left-2.5 h-6 w-1 rounded-full bg-white" />
                      ) : null}
                      <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                      <span>{item.title}</span>
                    </Link>

                    {item.href === "/inventory" && (
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setIsReportsOpen(!isReportsOpen)}
                          className={`relative flex min-h-12 w-full items-center justify-between px-8 py-3 text-sm transition cursor-pointer text-left ${
                            isInventoryReportActive
                              ? "bg-black font-semibold text-white"
                              : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {isInventoryReportActive ? (
                              <span className="absolute left-2.5 h-6 w-1 rounded-full bg-white" />
                            ) : null}
                            <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                            <span>Inventory Reports</span>
                          </div>
                          <ChevronDown
                            className={`size-4 shrink-0 transition-transform duration-200 ${
                              isReportsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isReportsOpen && (
                          <div className="flex flex-col border-l border-[#d2d2d2] ml-10 my-1 pl-3 gap-1.5">
                            {[
                              { title: "-- Inventory In Stock", href: "/inventory/in-stock" },
                              { title: "-- Inventory On Way", href: "/inventory/on-way" },
                              { title: "-- Inventory Received", href: "/inventory/received" },
                              { title: "-- Inventory Installed", href: "/inventory/installed" },
                            ].map((sub) => {
                              const subActive = activeHref === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={`text-xs py-1 transition ${
                                    subActive
                                      ? "text-black font-semibold"
                                      : "text-[#777777] hover:text-black"
                                  }`}
                                >
                                  {sub.title}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[#fbfbfb]">
          <header className="sticky top-0 z-20 flex flex-col gap-5 border-b border-[#d2d2d2] bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex items-center gap-5">
              <div className="lg:hidden">
                <Logo />
              </div>
              <div className="hidden h-14 w-px bg-[#d2d2d2] lg:block" />
              <div>
                <p className="text-sm font-medium text-[#777777]">{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-black sm:text-[28px]">
                  {title}
                </h1>
              </div>
            </div>

            <HeaderActions displayName={displayName} initials={initials} user={user} />
          </header>

          <div className="flex-1 px-5 py-5 sm:px-8 lg:px-10">
            <ContentRouteLoader>{children}</ContentRouteLoader>
          </div>
        </div>
      </section>
    </main>
  );
}
