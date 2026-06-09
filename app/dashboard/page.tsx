import {
  Activity,
  Bell,
  CalendarDays,
  Car,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Gauge,
  Home,
  MapPinned,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "../_components/logout-button";

const menuItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Tracking", icon: MapPinned },
  { label: "Customers", icon: Users },
  { label: "Vehicles", icon: Car },
  { label: "Work Orders", icon: Wrench },
  { label: "Finance", icon: CircleDollarSign },
  { label: "Messages", icon: MessageSquareText },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Active Units", value: "320", icon: Activity },
  { label: "Field Jobs", value: "86", icon: ClipboardList },
  { label: "Online Vehicles", value: "278", icon: Car },
  { label: "Alerts", value: "14", icon: ShieldCheck },
];

const bars = [72, 88, 50, 82, 74];

const operations = [
  {
    name: "Tracker installation",
    customer: "Al Noor Logistics",
    amount: "$1,450.95",
    date: "Today",
    status: "Scheduled",
    id: "JOB-0420-26",
  },
  {
    name: "Monthly subscription",
    customer: "Metro Fleet",
    amount: "$2,535.50",
    date: "Jun 8, 2026",
    status: "Paid",
    id: "INV-03124-26",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
        <Gauge className="size-5" strokeWidth={2.4} />
      </div>
      <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
        SOGOERP
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#d2d2d2] p-2 sm:p-4 lg:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-16px)] w-full max-w-[1440px] overflow-hidden rounded-[10px] border border-white bg-white shadow-[0_22px_80px_rgba(52,52,52,0.12)] sm:min-h-[calc(100vh-32px)] lg:min-h-[calc(100vh-48px)]">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#d2d2d2] bg-white lg:flex lg:flex-col">
          <div className="px-9 pb-10 pt-12">
            <Logo />
          </div>

          <nav className="flex-1">
            <p className="px-9 pb-3 text-sm font-medium text-[#343434]">Menu</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    className={`relative flex h-12 items-center gap-4 px-9 text-sm transition ${
                      item.active
                        ? "bg-black font-semibold text-white"
                        : "text-[#777777] hover:bg-[#fbfbfb] hover:text-black"
                    }`}
                    href="#"
                    key={item.label}
                  >
                    {item.active ? (
                      <span className="absolute left-2 h-8 w-1 rounded-full bg-white" />
                    ) : null}
                    <Icon className="size-[19px]" strokeWidth={1.8} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>

          <LogoutButton />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex flex-col gap-6 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-9 lg:py-9">
            <div className="flex items-center gap-5">
              <div className="relative hidden size-14 shrink-0 rounded-full border-2 border-[#343434] sm:block">
                <span className="absolute inset-2 rounded-full border-2 border-[#343434]" />
                <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rotate-45 bg-[#343434]" />
                <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 -rotate-45 bg-[#343434]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#777777]">GPS Operations ERP</p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-black sm:text-[28px]">
                  Hello, Admin
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                aria-label="Search"
                className="grid size-12 place-items-center rounded-full border border-[#d2d2d2] text-[#343434] transition hover:bg-[#fbfbfb]"
                type="button"
              >
                <Search className="size-5" strokeWidth={1.7} />
              </button>
              <button
                aria-label="Notifications"
                className="grid size-12 place-items-center rounded-full border border-[#d2d2d2] text-[#343434] transition hover:bg-[#fbfbfb]"
                type="button"
              >
                <Bell className="size-5" strokeWidth={1.7} />
              </button>
              <div className="grid size-12 place-items-center rounded-full bg-[#d2d2d2] text-sm font-bold text-black">
                SA
              </div>
            </div>
          </header>

          <section className="grid flex-1 gap-2 px-5 pb-5 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] lg:px-9">
            <div className="space-y-2">
              <article className="rounded-[8px] border border-[#d2d2d2] bg-white">
                <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div>
                    <h2 className="text-lg font-bold text-black">Fleet Activity</h2>
                    <p className="mt-1 text-sm text-[#777777]">
                      Installation, tracking, and subscription movement
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#999999]">
                    {["1D", "1W", "1M", "6M", "1Y"].map((period) => (
                      <button
                        className={`h-8 min-w-8 rounded-[6px] px-3 ${
                          period === "1M"
                            ? "bg-black text-white"
                            : "text-[#999999] hover:bg-[#fbfbfb]"
                        }`}
                        key={period}
                        type="button"
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-3 sm:px-6">
                  <svg
                    aria-label="Fleet activity chart"
                    className="h-[260px] w-full"
                    preserveAspectRatio="none"
                    role="img"
                    viewBox="0 0 720 260"
                  >
                    <defs>
                      <pattern
                        height="52"
                        id="grid"
                        patternUnits="userSpaceOnUse"
                        width="720"
                      >
                        <path d="M 0 52 H 720" fill="none" stroke="#eeeeee" />
                      </pattern>
                    </defs>
                    <rect fill="url(#grid)" height="260" width="720" />
                    <rect
                      fill="#fbfbfb"
                      height="200"
                      opacity="0.9"
                      rx="4"
                      width="84"
                      x="470"
                      y="24"
                    />
                    <path
                      d="M20 25 C35 118 58 148 92 118 S142 70 170 112 S232 185 270 105 S350 28 420 75 S460 150 498 116 S538 185 580 144 S630 18 700 28"
                      fill="none"
                      stroke="#bdbdbd"
                      strokeWidth="2.4"
                    />
                    <path
                      d="M20 76 C54 105 78 112 112 134 S148 68 188 88 S238 130 270 126 S292 62 336 80 S362 164 406 148 S455 76 486 126 S514 196 562 178 S626 176 646 120 S680 86 700 70"
                      fill="none"
                      stroke="#050505"
                      strokeWidth="2.8"
                    />
                    {[20, 112, 188, 270, 365, 486, 580, 676].map((x, index) => (
                      <circle
                        cx={x}
                        cy={[76, 134, 88, 126, 140, 112, 176, 140][index]}
                        fill="#050505"
                        key={x}
                        r="6"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                    ))}
                    <g transform="translate(447 62)">
                      <rect fill="#050505" height="36" rx="5" width="74" />
                      <path d="M37 42 L29 34 H45 Z" fill="#050505" />
                      <text
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                        x="37"
                        y="23"
                      >
                        1450
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="grid border-t border-[#d2d2d2] px-5 py-5 sm:grid-cols-4 sm:px-7">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div className="py-3 sm:py-0" key={stat.label}>
                        <div className="flex items-center gap-2 text-sm text-[#343434]">
                          <Icon className="size-4" strokeWidth={1.8} />
                          <span>{stat.label}</span>
                        </div>
                        <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em] text-black">
                          {stat.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">Recent Operations</h2>
                  <button
                    aria-label="Open calendar"
                    className="grid size-9 place-items-center rounded-full border border-[#d2d2d2] text-[#343434]"
                    type="button"
                  >
                    <CalendarDays className="size-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="text-[#343434]">
                      <tr>
                        {["Name", "Amount", "Date", "Status", "Reference"].map(
                          (heading) => (
                            <th className="pb-4 font-medium" key={heading}>
                              <button className="inline-flex items-center gap-1" type="button">
                                {heading}
                                <ChevronDown className="size-3" />
                              </button>
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {operations.map((operation) => (
                        <tr className="border-t border-[#eeeeee]" key={operation.id}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid size-12 place-items-center rounded-[6px] border border-[#d2d2d2] bg-[#fbfbfb]">
                                <MapPinned className="size-5 text-[#343434]" />
                              </div>
                              <div>
                                <p className="font-semibold text-black">{operation.name}</p>
                                <p className="mt-1 text-xs text-[#999999]">
                                  {operation.customer}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-lg font-bold text-black">
                            {operation.amount}
                          </td>
                          <td className="py-4">
                            <p className="font-semibold text-black">{operation.date}</p>
                            <p className="mt-1 text-xs text-[#999999]">09:45 am</p>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex h-9 items-center rounded-[6px] border px-4 font-semibold ${
                                operation.status === "Paid"
                                  ? "border-black bg-black text-white"
                                  : "border-[#d2d2d2] bg-white text-[#343434]"
                              }`}
                            >
                              {operation.status}
                            </span>
                          </td>
                          <td className="py-4 font-semibold text-black">{operation.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <div className="space-y-2">
              <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-bold text-black">Analytics</h2>
                <div className="mt-6 flex h-[150px] items-end justify-between gap-2">
                  {bars.map((bar, index) => (
                    <div className="flex h-full flex-1 flex-col items-center justify-end gap-3" key={bar}>
                      <div
                        className={`w-full rounded-[6px] border border-[#d2d2d2] ${
                          index === 2 || index === 3 ? "bg-black" : "bg-[#fbfbfb]"
                        }`}
                        style={{ height: `${bar}%` }}
                      />
                      <span className="text-xs text-[#999999]">{18 + index} Jun</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-black">Available Balance</h2>
                    <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em] text-black">
                      $150,545.90
                    </p>
                  </div>
                  <button className="mt-9 inline-flex items-center gap-1 text-sm font-semibold text-black">
                    USD
                    <ChevronDown className="size-4" />
                  </button>
                </div>
                <button
                  className="mt-5 flex h-12 w-full items-center justify-between rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-sm text-[#343434]"
                  type="button"
                >
                  <span className="inline-flex items-center gap-3">
                    <CreditCard className="size-5" />
                    Main operating wallet
                  </span>
                  <ChevronDown className="size-4" />
                </button>
                <button
                  className="mt-5 h-12 w-full rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434]"
                  type="button"
                >
                  Withdraw Money
                </button>
              </article>

              <article className="rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfb] p-5 sm:p-7">
                <h2 className="text-lg font-bold text-black">System Access</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <a
                    className="flex h-12 items-center justify-center rounded-[6px] bg-black px-5 text-sm font-bold text-white"
                    href="/login"
                  >
                    Login
                  </a>
                  <a
                    className="flex h-12 items-center justify-center rounded-[6px] border border-[#d2d2d2] bg-white px-5 text-sm font-bold text-black"
                    href="/signup"
                  >
                    Sign Up
                  </a>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
