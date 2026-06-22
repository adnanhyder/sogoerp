"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
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
  
  const [isCustomersOpen, setIsCustomersOpen] = useState(() => {
    return activeHref === "/customers/records" || activeHref === "/customers";
  });

  const [isTechniciansOpen, setIsTechniciansOpen] = useState(() => {
    return activeHref === "/technicians" || activeHref === "/technicians/records" || activeHref === "/technicians/payroll";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="h-screen flex flex-col bg-white overflow-hidden">
      <section className="flex flex-1 w-full bg-white relative overflow-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-[fadeIn_0.3s_ease-out]" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
        
        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex h-full w-[276px] shrink-0 flex-col border-r border-[#d2d2d2] bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
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
                    {item.href !== "/customers" && item.href !== "/technicians" && (
                      <Link
                        className={`relative flex min-h-12 items-center gap-4 px-8 py-3 text-sm transition ${
                          active
                            ? "bg-black font-semibold text-white"
                            : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                        }`}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        {active ? (
                          <span className="absolute left-2.5 h-6 w-1 rounded-full bg-white" />
                        ) : null}
                        <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                        <span>{item.title}</span>
                      </Link>
                    )}

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
                        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                          isReportsOpen ? "grid-rows-[1fr] opacity-100 my-1" : "grid-rows-[0fr] opacity-0 my-0"
                        }`}>
                          <div className="overflow-hidden flex flex-col border-l border-[#d2d2d2] ml-10 pl-3 gap-1.5">
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
                                  onClick={() => setIsSidebarOpen(false)}
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
                        </div>
                      </div>
                    )}

                    {item.href === "/customers" && (
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setIsCustomersOpen(!isCustomersOpen)}
                          className={`relative flex min-h-12 w-full items-center justify-between px-8 py-3 text-sm transition cursor-pointer text-left ${
                            activeHref === "/customers/records" || activeHref === "/customers"
                              ? "bg-black font-semibold text-white"
                              : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {activeHref === "/customers/records" || activeHref === "/customers" ? (
                              <span className="absolute left-2.5 h-6 w-1 rounded-full bg-white" />
                            ) : null}
                            <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                            <span>Customers</span>
                          </div>
                          <ChevronDown
                            className={`size-4 shrink-0 transition-transform duration-200 ${
                              isCustomersOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                          isCustomersOpen ? "grid-rows-[1fr] opacity-100 my-1" : "grid-rows-[0fr] opacity-0 my-0"
                        }`}>
                          <div className="overflow-hidden flex flex-col border-l border-[#d2d2d2] ml-10 pl-3 gap-1.5">
                            {[
                              { title: "-- Active Customers", href: "/customers" },
                              { title: "-- Recent Customers", href: "/customers/records" },
                            ].map((sub) => {
                              const subActive = activeHref === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setIsSidebarOpen(false)}
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
                        </div>
                      </div>
                    )}

                    {item.href === "/technicians" && (
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setIsTechniciansOpen(!isTechniciansOpen)}
                          className={`relative flex min-h-12 w-full items-center justify-between px-8 py-3 text-sm transition cursor-pointer text-left ${
                            activeHref === "/technicians" || activeHref === "/technicians/records" || activeHref === "/technicians/payroll"
                              ? "bg-black font-semibold text-white"
                              : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {activeHref === "/technicians" || activeHref === "/technicians/records" || activeHref === "/technicians/payroll" ? (
                              <span className="absolute left-2.5 h-6 w-1 rounded-full bg-white" />
                            ) : null}
                            <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                            <span>Technicians</span>
                          </div>
                          <ChevronDown
                            className={`size-4 shrink-0 transition-transform duration-200 ${
                              isTechniciansOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                          isTechniciansOpen ? "grid-rows-[1fr] opacity-100 my-1" : "grid-rows-[0fr] opacity-0 my-0"
                        }`}>
                          <div className="overflow-hidden flex flex-col border-l border-[#d2d2d2] ml-10 pl-3 gap-1.5">
                            {[
                              { title: "-- Technicians Overview", href: "/technicians" },
                              { title: "-- Activity Logs", href: "/technicians/records" },
                              { title: "-- Paid Commissions", href: "/technicians/payroll" },
                            ].map((sub) => {
                              const subActive = activeHref === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setIsSidebarOpen(false)}
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
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[#fbfbfb] h-full overflow-y-auto relative">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#d2d2d2] bg-white px-5 py-4 sm:px-8 lg:px-10">
            {/* Mobile Top Row: Hamburger & Logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-1.5 -ml-1.5 text-gray-500 hover:text-black transition-colors rounded-md hover:bg-gray-100"
                type="button"
                aria-label="Open sidebar"
              >
                <Menu className="size-6" />
              </button>
              <Logo />
            </div>

            {/* Actions (Right aligned) */}
            <div className="flex flex-1 justify-end">
              <HeaderActions displayName={displayName} initials={initials} user={user} />
            </div>
          </header>

          <div className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
            <div className="mb-6">
              <p className="text-sm font-medium text-[#777777]">{eyebrow}</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.01em] text-black sm:text-[28px]">
                {title}
              </h1>
            </div>
            <ContentRouteLoader>{children}</ContentRouteLoader>
          </div>
        </div>
      </section>
    </main>
  );
}
