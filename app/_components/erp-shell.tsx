import Link from "next/link";
import { Gauge } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { erpModules } from "@/lib/erp-data";
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
  return (
    <Link className="flex items-center gap-3" href="/dashboard">
      <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
        <Gauge className="size-5" strokeWidth={2.4} />
      </div>
      <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
        SOGOERP
      </span>
    </Link>
  );
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

                return (
                  <Link
                    className={`relative flex min-h-12 items-center gap-4 px-8 py-3 text-sm transition ${
                      active
                        ? "bg-black font-semibold text-white"
                        : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {active ? (
                      <span className="absolute left-2 h-8 w-1 rounded-full bg-white" />
                    ) : null}
                    <Icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                    <span>{item.title}</span>
                  </Link>
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
