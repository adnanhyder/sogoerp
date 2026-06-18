import {
  Activity,
  CalendarDays,
  Car,
  ClipboardList,
  MapPinned,
} from "lucide-react";
import { ErpShell } from "../_components/erp-shell";
import { FollowUpsBanner } from "../_components/follow-ups-banner";
import { erpModules } from "@/lib/erp-data";
import { getDashboardData } from "@/lib/erp-queries";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const statIcons = [Activity, ClipboardList, Car, CalendarDays];
const adminFlowHrefs = ["/inventory", "/leads", "/technicians", "/customers"];
const adminFlowModules = adminFlowHrefs
  .map((href) => erpModules.find((module) => module.href === href))
  .filter((module): module is NonNullable<typeof module> => Boolean(module));
const chartWidth = 720;
const chartHeight = 260;
const chartPadding = 24;

type ChartPoint = {
  x: number;
  y: number;
};

function chartPoints(values: number[], maxValue: number): ChartPoint[] {
  const innerHeight = chartHeight - chartPadding * 2;
  const step = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;

  return values.map((value, index) => ({
    x: Math.round(index * step),
    y: Math.round(chartPadding + (1 - value / maxValue) * innerHeight),
  }));
}

function smoothPath(points: ChartPoint[]) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M${points[0].x} ${points[0].y}`;
  }

  const commands = [`M${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;
    const tension = 0.22;
    const controlOne = {
      x: current.x + (next.x - previous.x) * tension,
      y: current.y + (next.y - previous.y) * tension,
    };
    const controlTwo = {
      x: next.x - (afterNext.x - current.x) * tension,
      y: next.y - (afterNext.y - current.y) * tension,
    };

    commands.push(
      `C${controlOne.x.toFixed(1)} ${controlOne.y.toFixed(1)} ${controlTwo.x.toFixed(1)} ${controlTwo.y.toFixed(1)} ${next.x} ${next.y}`,
    );
  }

  return commands.join(" ");
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const dashboard = await getDashboardData(supabase);
  const {
    bars,
    chartSeries,
    kpis,
    moduleSnapshots,
    operations,
    pipelineStages,
    stats,
  } = dashboard.data;
  const chartMax = Math.max(1, ...chartSeries.primary, ...chartSeries.secondary);
  const primaryPoints = chartPoints(chartSeries.primary, chartMax);
  const secondaryPoints = chartPoints(chartSeries.secondary, chartMax);
  const primaryPath = smoothPath(primaryPoints);
  const secondaryPath = smoothPath(secondaryPoints);

  const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: followUpsData } = await supabase
    .from("lead_follow_ups")
    .select("id,reason,next_follow_up_at,lead_id,leads(name,stage)")
    .lte("next_follow_up_at", oneDayAhead)
    .eq("seen", false)
    .order("next_follow_up_at", { ascending: true });

  const activeFollowUps = (followUpsData ?? []).filter((fu: any) => {
    const stage = fu.leads?.stage;
    return stage !== "won" && stage !== "installed";
  });

  return (
    <ErpShell activeHref="/dashboard" title="Business Overview" user={user}>
      <div className="space-y-3">
        {dashboard.error ? (
          <section className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 text-sm font-semibold text-black">
            Database setup needed: {dashboard.error}
          </section>
        ) : null}

        <FollowUpsBanner followUps={activeFollowUps} />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((card) => (
            <article
              className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/50 transition hover:shadow-md hover:scale-[1.01]"
              key={card.label}
            >
              <p className="text-sm font-medium text-[#777777]">{card.label}</p>
              <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.02em] text-black">
                {card.value}
              </p>
              <p className="mt-5 text-sm font-semibold text-[#343434]">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
          <div className="space-y-3">
            <article className="rounded-[16px] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/50">
              <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <h2 className="text-lg font-bold text-black">Fleet Activity</h2>
                  <p className="mt-1 text-sm text-[#777777]">
                    Installation, tracking, and subscription movement
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#999999]">
                  {["1D", "1W", "1M", "6M", "1Y"].map((period) => (
                    <span
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] px-3 ${
                        period === "1M"
                          ? "bg-black text-white"
                          : "text-[#999999]"
                      }`}
                      key={period}
                    >
                      {period}
                    </span>
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
                    <pattern height="52" id="grid" patternUnits="userSpaceOnUse" width="720">
                      <path d="M 0 52 H 720" fill="none" stroke="#eeeeee" />
                    </pattern>
                  </defs>
                  <rect fill="url(#grid)" height="260" width="720" />
                  <rect fill="#fbfbfb" height="200" opacity="0.9" rx="4" width="84" x="470" y="24" />
                  <path
                    d={secondaryPath}
                    fill="none"
                    stroke="#bdbdbd"
                    strokeWidth="2.4"
                  />
                  <path
                    d={primaryPath}
                    fill="none"
                    stroke="#050505"
                    strokeWidth="2.8"
                  />
                  {primaryPoints.map((point, index) => (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      fill="#050505"
                      key={`${point.x}-${index}`}
                      r="6"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              </div>

              <div className="grid border-t border-gray-100 px-6 py-6 sm:grid-cols-4 sm:px-8 bg-gray-50/30 rounded-b-[16px]">
                {stats.map((stat, index) => {
                  const Icon = statIcons[index] ?? Activity;

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

            <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">Recent Operations</h2>
              </div>

              <div className="overflow-x-auto rounded-[12px] border border-gray-100 bg-white">
                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                  <thead className="bg-[#fbfbfb] text-gray-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-100">
                    <tr>
                      {["Name", "Amount", "Date", "Status", "Reference"].map((heading) => (
                        <th className="px-6 py-3.5 font-extrabold text-[#7a7a7a]" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {operations.length ? (
                    operations.map((operation) => (
                      <tr className="hover:bg-[#fbfbfb]/80 transition-colors" key={operation.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-[8px] border border-gray-100 bg-gray-50">
                              <MapPinned className="size-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{operation.name}</p>
                              <p className="mt-0.5 text-xs font-semibold text-gray-500">{operation.customer}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-base font-black text-green-700 tabular-nums">{operation.amount}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{operation.date}</p>
                           <p className="mt-0.5 text-[10px] font-bold text-gray-400">09:45 AM</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold ${
                              operation.status === "Paid"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            {operation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-black tabular-nums">{operation.id}</td>
                       </tr>
                     ))
                     ) : (
                       <tr>
                         <td className="px-6 py-8 text-center text-sm font-semibold text-gray-500" colSpan={5}>
                           No work orders found yet.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </article>
          </div>

          <div className="space-y-3">
            <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
              <h2 className="text-lg font-bold text-black">Lead Funnel</h2>
              <div className="mt-5 space-y-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#343434]">{stage.label}</span>
                      <span className="font-bold text-black">{stage.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eeeeee]">
                      <div
                        className="h-2 rounded-full bg-black"
                        style={{
                          width: `${
                            pipelineStages.reduce((total, item) => total + item.count, 0)
                              ? Math.max(
                                  6,
                                  Math.round(
                                    (stage.count /
                                      pipelineStages.reduce(
                                        (total, item) => total + item.count,
                                        0,
                                      )) *
                                      100,
                                  ),
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[16px] border border-gray-100 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-gray-100/50">
              <h2 className="text-lg font-bold text-black">Analytics</h2>
              <div className="mt-6 flex h-[150px] items-end justify-between gap-2">
                {bars.map((bar, index) => (
                  <div className="flex h-full flex-1 flex-col items-center justify-end gap-3" key={`${bar}-${index}`}>
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

            {moduleSnapshots.map((snapshot) => (
              <article
                className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/50 transition hover:shadow-md hover:scale-[1.01]"
                key={snapshot.title}
              >
                <h2 className="text-lg font-bold text-black">{snapshot.title}</h2>
                <div className="mt-4 space-y-2">
                  {snapshot.rows.map(([label, value]) => (
                    <div
                      className="flex items-center justify-between rounded-[6px] bg-[#fbfbfb] px-4 py-3 text-sm"
                      key={label}
                    >
                      <span className="font-medium text-[#777777]">{label}</span>
                      <span className="font-bold text-black">{value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {adminFlowModules.map((module) => {
            const Icon = module.icon;

            return (
              <a
                className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/50 transition hover:shadow-md hover:scale-[1.02] hover:border-black"
                href={module.href}
                key={module.href}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-black text-white">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <h2 className="text-lg font-bold text-black">{module.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#777777]">{module.summary}</p>
              </a>
            );
          })}
        </section>
      </div>
    </ErpShell>
  );
}
