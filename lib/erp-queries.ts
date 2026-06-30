import type { SupabaseClient } from "@supabase/supabase-js";

type QueryResult<T> = {
  data: T;
  error: string | null;
};

type CountQuery = {
  eq: (column: string, value: unknown) => CountQuery;
  gte: (column: string, value: unknown) => CountQuery;
  in: (column: string, values: readonly unknown[]) => CountQuery;
  lt: (column: string, value: unknown) => CountQuery;
  lte: (column: string, value: unknown) => CountQuery;
  or: (filters: string) => CountQuery;
} & PromiseLike<{
  count: number | null;
  error: { message: string } | null;
}>;

type DashboardOperation = {
  amount: string;
  customer: string;
  date: string;
  id: string;
  name: string;
  status: string;
};

export type DashboardData = {
  bars: number[];
  chartSeries: {
    primary: number[];
    secondary: number[];
  };
  kpis: { detail: string; label: string; value: string }[];
  moduleSnapshots: { rows: string[][]; title: string }[];
  operations: DashboardOperation[];
  pipelineStages: { count: number; label: string }[];
  stats: { label: string; value: string }[];
};

export type ModuleData = {
  metrics: { detail: string; label: string; value: string }[];
  rows: string[][];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
});

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatMoney(value: number) {
  return `Rs. ${moneyFormatter.format(value)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return dateTimeFormatter.format(new Date(value));
}

function mergeRowsById(
  ...rowGroups: readonly (readonly Record<string, unknown>[] | null | undefined)[]
) {
  const merged = new Map<string, Record<string, unknown>>();

  for (const rows of rowGroups) {
    for (const row of rows ?? []) {
      const id = String(row.id ?? "");
      if (id && !merged.has(id)) {
        merged.set(id, row);
      }
    }
  }

  return [...merged.values()];
}

async function countRows(
  supabase: SupabaseClient,
  table: string,
  filters?: (query: CountQuery) => CountQuery,
) {
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true }) as unknown as CountQuery;

  if (filters) {
    query = filters(query);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function relatedField(value: unknown, field: string) {
  if (Array.isArray(value)) {
    const first = value[0] as Record<string, unknown> | undefined;
    return first?.[field] ? String(first[field]) : undefined;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return record[field] ? String(record[field]) : undefined;
  }

  return undefined;
}

async function sumFinance(
  supabase: SupabaseClient,
  entryType: "expense" | "income",
  startDate: string,
) {
  const { data, error } = await supabase
    .from("finance_entries")
    .select("amount")
    .eq("entry_type", entryType)
    .gte("occurred_on", startDate);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);
}

export async function getDashboardData(
  supabase: SupabaseClient,
): Promise<QueryResult<DashboardData>> {
  const empty: DashboardData = {
    bars: [0, 0, 0, 0, 0],
    chartSeries: {
      primary: [0, 0, 0, 0, 0, 0, 0, 0],
      secondary: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    kpis: [
      { label: "Devices in Queue", value: "0", detail: "Awaiting assignment" },
      { label: "Devices with Technicians", value: "0", detail: "Currently with field techs" },
      { label: "On the Way", value: "0", detail: "In transit to technicians" },
      { label: "Installed Devices", value: "0", detail: "Completed installations" },
      { label: "Total Devices", value: "0", detail: "Excluding installed devices" },
    ],
    moduleSnapshots: [
      {
        title: "Device Lifecycle",
        rows: [
          ["Purchased", "0"],
          ["IMEI Approved", "0"],
          ["With Technician", "0"],
          ["Installed", "0"],
        ],
      },
      {
        title: "Field Operations",
        rows: [
          ["Assigned Today", "0"],
          ["Completed Today", "0"],
          ["Awaiting Proof", "0"],
          ["SLA Risk", "0"],
        ],
      },
    ],
    operations: [],
    pipelineStages: [
      { label: "New Lead", count: 0 },
      { label: "Contacted", count: 0 },
      { label: "Negotiation", count: 0 },
      { label: "Scheduled", count: 0 },
      { label: "Installed", count: 0 },
    ],
    stats: [
      { label: "Active Units", value: "0" },
      { label: "Field Jobs", value: "0" },
      { label: "Online Vehicles", value: "0" },
      { label: "Install SLA", value: "0%" },
    ],
  };

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [
      devicesRes,
      workOrdersRes,
      supportTicketsRes,
      leadsRes,
      vehiclesRes,
      financeRes,
      commissionsRes,
    ] = await Promise.all([
      supabase.from("devices").select("status, custody_status, purchase_cost, installation_date"),
      supabase.from("work_orders").select("id, status, scheduled_at, completed_at, before_image_url, after_image_url, created_at, customers(full_name), devices(imei)"),
      supabase.from("support_tickets").select("status"),
      supabase.from("leads").select("stage, created_at"),
      supabase.from("vehicles").select("id", { count: "exact", head: true }),
      supabase.from("finance_entries").select("amount, entry_type").gte("occurred_on", monthStart),
      supabase.from("commissions").select("amount").gte("created_at", monthStart),
    ]);

    const firstError = [
      devicesRes.error,
      workOrdersRes.error,
      supportTicketsRes.error,
      leadsRes.error,
      vehiclesRes.error,
      financeRes.error,
      commissionsRes.error,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    const devices = devicesRes.data ?? [];
    const workOrders = workOrdersRes.data ?? [];
    const supportTickets = supportTicketsRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const totalVehicles = vehiclesRes.count ?? 0;
    const financeEntries = financeRes.data ?? [];
    const commissions = commissionsRes.data ?? [];

    const activeDevices = devices.filter((d) =>
      ["installed", "activated_with_sim", "active"].includes(d.status ?? "")
    ).length;
    const totalDevices = devices.length;
    const pendingInstalls = workOrders.filter((w) =>
      ["assigned", "scheduled", "in_progress"].includes(w.status ?? "")
    ).length;
    const totalWorkOrders = workOrders.length;
    const openTickets = supportTickets.filter((t) =>
      ["open", "in_progress"].includes(t.status ?? "")
    ).length;
    const totalTickets = supportTickets.length;

    const monthlyIncome = financeEntries
      .filter((f) => f.entry_type === "income")
      .reduce((sum, f) => sum + Number(f.amount ?? 0), 0);
    const monthlyExpenses = financeEntries
      .filter((f) => f.entry_type === "expense")
      .reduce((sum, f) => sum + Number(f.amount ?? 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

    const purchasedDevices = devices.filter((d) => d.status === "purchased").length;
    const approvedDevices = devices.filter((d) => d.status === "imei_approved").length;
    const techDevices = devices.filter((d) => d.custody_status === "received_by_technician").length;
    const installedDevices = activeDevices;

    const assignedToday = workOrders.filter((w) => {
      const sched = w.scheduled_at;
      return sched && sched >= todayStart && sched < tomorrowStart;
    }).length;
    const completedToday = workOrders.filter((w) => {
      const comp = w.completed_at;
      return w.status === "completed" && comp && comp >= todayStart && comp < tomorrowStart;
    }).length;
    const awaitingProof = workOrders.filter(
      (w) => w.status === "completed" && (!w.before_image_url || !w.after_image_url)
    ).length;

    const totalLeads = leads.length;
    const monthlyDevicePurchaseCost = devices
      .filter((d) => {
        const inst = d.installation_date;
        return inst && inst >= monthStart;
      })
      .reduce((sum, d) => sum + Number(d.purchase_cost ?? 0), 0);
    const monthlyTechnicianCommissions = totalCommissions;

    const leadStages = [
      leads.filter((l) => l.stage === "new_lead").length,
      leads.filter((l) => l.stage === "contacted").length,
      leads.filter((l) => l.stage === "negotiation").length,
      leads.filter((l) => l.stage === "installation_scheduled").length,
      leads.filter((l) => l.stage === "installed").length,
    ];

    const operationsData = [...workOrders]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 8);

    const operations = ((operationsData ?? []) as Record<string, unknown>[]).map((operation) => ({
      amount: "-",
      customer: relatedField(operation.customers, "full_name") ?? "-",
      date: formatDate(String(operation.scheduled_at ?? operation.created_at ?? "")),
      id: `JOB-${String(operation.id).slice(0, 8)}`,
      name: relatedField(operation.devices, "imei") ?? "Work order",
      status: String(operation.status ?? "-").replaceAll("_", " "),
    }));

    const installSla = totalWorkOrders
      ? Math.round((completedToday / Math.max(assignedToday, 1)) * 100)
      : 0;
    const slaRisk = Math.max(0, assignedToday - completedToday);
    const totalExpenses = monthlyExpenses + monthlyDevicePurchaseCost + monthlyTechnicianCommissions;
    const netProfit = monthlyIncome - totalExpenses;

    const last8Days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 - i));
      return d.toISOString().slice(0, 10);
    });

    const primaryActivity = last8Days.map(date => {
      return workOrders.filter(w => w.status === "completed" && w.completed_at && String(w.completed_at).startsWith(date)).length;
    });

    const secondaryActivity = last8Days.map(date => {
      return leads.filter(l => l.created_at && String(l.created_at).startsWith(date)).length;
    });

    const installedCount = activeDevices;
    const onTheWayCount = devices.filter((d) => d.custody_status === "on_the_way").length;
    const techDevicesCount = techDevices;
    const inQueueCount = devices.filter((d) => 
       !["installed", "activated_with_sim", "active"].includes(d.status ?? "") &&
       d.custody_status !== "on_the_way" && 
       d.custody_status !== "received_by_technician"
    ).length;
    const installedThisMonthCount = devices.filter((d) =>
      ["installed", "activated_with_sim", "active"].includes(d.status ?? "") &&
      d.installation_date && d.installation_date >= monthStart
    ).length;
    const totalValidDevices = totalDevices - installedCount;

    return {
      data: {
        bars: leadStages.map((count) =>
          totalLeads ? Math.max(6, Math.round((count / totalLeads) * 100)) : 0,
        ),
        chartSeries: {
          primary: primaryActivity,
          secondary: secondaryActivity,
        },
        kpis: [
          {
            label: "Devices in Queue",
            value: formatCount(inQueueCount),
            detail: "Awaiting assignment",
          },
          {
            label: "Devices with Technicians",
            value: formatCount(techDevicesCount),
            detail: "Currently with field techs",
          },
          {
            label: "On the Way",
            value: formatCount(onTheWayCount),
            detail: "In transit to technicians",
          },
          {
            label: "Installed Devices",
            value: formatCount(installedCount),
            detail: "Completed installations",
          },
          {
            label: "Installed This Month",
            value: formatCount(installedThisMonthCount),
            detail: "Installations in current month",
          },
          {
            label: "Total Devices",
            value: formatCount(totalValidDevices),
            detail: "Excluding installed devices",
          },
        ],
        moduleSnapshots: [
          {
            title: "Device Lifecycle",
            rows: [
              ["Purchased", formatCount(purchasedDevices)],
              ["IMEI Approved", formatCount(approvedDevices)],
              ["With Technician", formatCount(techDevices)],
              ["Installed", formatCount(installedDevices)],
            ],
          },
          {
            title: "Field Operations",
            rows: [
              ["Assigned Today", formatCount(assignedToday)],
              ["Completed Today", formatCount(completedToday)],
              ["Awaiting Proof", formatCount(awaitingProof)],
              ["SLA Risk", formatCount(slaRisk)],
            ],
          },
        ],
        operations,
        pipelineStages: [
          { label: "New Lead", count: leadStages[0] },
          { label: "Contacted", count: leadStages[1] },
          { label: "Negotiation", count: leadStages[2] },
          { label: "Scheduled", count: leadStages[3] },
          { label: "Installed", count: leadStages[4] },
        ],
        stats: [
          { label: "Active Units", value: formatCount(activeDevices) },
          { label: "Field Jobs", value: formatCount(totalWorkOrders) },
          { label: "Online Vehicles", value: formatCount(totalVehicles) },
          { label: "Install SLA", value: `${installSla}%` },
        ],
      },
      error: null,
    };
  } catch (error) {
    return {
      data: empty,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data from Supabase.",
    };
  }
}

async function sumCommissions(supabase: SupabaseClient, startDate?: string) {
  let query = supabase.from("commissions").select("amount").eq("paid", false);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);
}

async function sumDevicePurchaseCosts(supabase: SupabaseClient, startDate: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("purchase_cost")
    .gte("installation_date", startDate);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, row) => total + Number(row.purchase_cost ?? 0), 0);
}

async function sumAllCommissions(supabase: SupabaseClient, startDate: string) {
  const { data, error } = await supabase
    .from("commissions")
    .select("amount")
    .gte("created_at", startDate);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);
}

export async function getModuleData(
  supabase: SupabaseClient,
  key: string,
  options: { searchQuery?: string } = {},
): Promise<QueryResult<ModuleData>> {
  try {
    switch (key) {
      case "inventory": {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);

        const [total, companyHands, onTheWay, withTechnicians, faulty, installed, installedThisMonth, tableRows] = await Promise.all([
          countRows(supabase, "devices"),
          countRows(supabase, "devices", (query) => query.eq("custody_status", "company_hands")),
          countRows(supabase, "devices", (query) => query.eq("custody_status", "on_the_way")),
          countRows(supabase, "devices", (query) => query.eq("custody_status", "received_by_technician")),
          countRows(supabase, "devices", (query) => query.eq("status", "faulty")),
          countRows(supabase, "devices", (query) => query.in("status", ["installed", "activated_with_sim", "active"])),
          countRows(supabase, "devices", (query) => query.in("status", ["installed", "activated_with_sim", "active"]).gte("installation_date", monthStart)),
          inventoryRows(supabase, options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "Devices in Queue", value: formatCount(total - installed - onTheWay - withTechnicians), detail: "Awaiting assignment" },
              { label: "Devices with Technicians", value: formatCount(withTechnicians), detail: "Currently with field techs" },
              { label: "On the Way", value: formatCount(onTheWay), detail: "In transit to technicians" },
              { label: "Installed Devices", value: formatCount(installed), detail: "Completed installations" },
              { label: "Installed This Month", value: formatCount(installedThisMonth), detail: "Installations in current month" },
              { label: "Total Devices", value: formatCount(total - installed), detail: "Excluding installed devices" },
            ],
            rows: tableRows,
          },
          error: null,
        };
      }
      case "integrations": {
        const [apiSources, inboundEvents, importJobs, exportJobs, rowsData] = await Promise.all([
          countRows(supabase, "api_sources"),
          countRows(supabase, "inbound_events"),
          countRows(supabase, "import_jobs"),
          countRows(supabase, "export_jobs"),
          tableRows(supabase, "api_sources", ["name", "source_key", "active", "created_at"], options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "API Sources", value: formatCount(apiSources), detail: "External apps registered" },
              { label: "Inbound Events", value: formatCount(inboundEvents), detail: "Payloads received" },
              { label: "Import Jobs", value: formatCount(importJobs), detail: "CSV/XLSX batches" },
              { label: "Export Jobs", value: formatCount(exportJobs), detail: "Generated files" },
            ],
            rows: rowsData,
          },
          error: null,
        };
      }
      case "leads": {
        const [newLeads, followUpsDue, matured, total, tableRows] = await Promise.all([
          countRows(supabase, "leads", (query) => query.eq("stage", "new_lead")),
          countRows(supabase, "leads", (query) => query.lte("next_follow_up_at", new Date().toISOString())),
          countRows(supabase, "leads", (query) => query.eq("stage", "matured")),
          countRows(supabase, "leads"),
          leadRows(supabase, options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "New Leads", value: formatCount(newLeads), detail: "Fresh inquiries" },
              { label: "Follow-ups Due", value: formatCount(followUpsDue), detail: "Due now or overdue" },
              { label: "Matured Leads", value: formatCount(matured), detail: "Ready to schedule" },
              { label: "Total Leads", value: formatCount(total), detail: "All lead records" },
            ],
            rows: tableRows,
          },
          error: null,
        };
      }
      case "technicians": {
        const [total, active, blocked, disputed, tableRows] = await Promise.all([
          countRows(supabase, "technicians"),
          countRows(supabase, "technicians", (query) => query.eq("active", true)),
          countRows(supabase, "technicians", (query) => query.eq("active", false)),
          countRows(supabase, "technicians", (query) => query.eq("disputed", true)),
          technicianRows(supabase, options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "Technicians", value: formatCount(total), detail: "All technician records" },
              { label: "Active", value: formatCount(active), detail: "Allowed to receive work" },
              { label: "Blocked", value: formatCount(blocked), detail: "Access blocked" },
              { label: "Disputed", value: formatCount(disputed), detail: "Marked for review" },
            ],
            rows: tableRows,
          },
          error: null,
        };
      }
      case "customers": {
        const [total, meetingsDue, scheduled, completed, tableRows] = await Promise.all([
          countRows(supabase, "customers"),
          countRows(supabase, "customer_meetings", (query) => query.lte("scheduled_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).in("status", ["scheduled", "rescheduled"])),
          countRows(supabase, "customer_meetings", (query) => query.in("status", ["scheduled", "rescheduled"])),
          countRows(supabase, "work_orders", (query) => query.eq("status", "completed")),
          customerRows(supabase, options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "Customers", value: formatCount(total), detail: "All customer records" },
              { label: "Meetings Due", value: formatCount(meetingsDue), detail: "Due within 24 hours" },
              { label: "Scheduled", value: formatCount(scheduled), detail: "Open technician meetings" },
              { label: "Completed", value: formatCount(completed), detail: "Completed installations" },
            ],
            rows: tableRows,
          },
          error: null,
        };
      }
      case "simConfig":
        return moduleQuery(supabase, "sims", ["sim_number", "network_provider", "apn_settings", "activation_date", "active"], options.searchQuery);
      case "finance":
        return moduleQuery(supabase, "finance_entries", ["category", "entry_type", "amount", "occurred_on", "note"], options.searchQuery);
      case "commissions":
        return moduleQuery(supabase, "commissions", ["reason", "amount", "paid", "created_at"], options.searchQuery);
      case "whatsapp":
        return moduleQuery(supabase, "communication_logs", ["channel", "direction", "message", "created_at"], options.searchQuery);
      case "support":
        return moduleQuery(supabase, "support_tickets", ["title", "priority", "status", "created_at"], options.searchQuery);
      case "documents":
        return moduleQuery(supabase, "documents", ["document_type", "file_url", "created_at"], options.searchQuery);
      case "insurance":
        return moduleQuery(supabase, "insurance_policies", ["customer_name", "policy_name", "premium", "end_date", "status"], options.searchQuery);
      case "reports":
        return moduleQuery(supabase, "report_definitions", ["name", "focus", "owner", "frequency", "status"], options.searchQuery);
      case "tracking":
        return moduleQuery(supabase, "tracking_events", ["entity", "location", "signal", "last_update", "status"], options.searchQuery);
      case "settings": {
        const [settings, apiSourcesSettings, inboundEventsSettings, importJobsSettings, rowsData] = await Promise.all([
          countRows(supabase, "settings_items"),
          countRows(supabase, "api_sources"),
          countRows(supabase, "inbound_events"),
          countRows(supabase, "import_jobs"),
          tableRows(supabase, "settings_items", ["name", "area", "owner", "created_at", "status"], options.searchQuery)
        ]);
        return {
          data: {
            metrics: [
              { label: "Settings", value: formatCount(settings), detail: "Configuration records" },
              { label: "API Sources", value: formatCount(apiSourcesSettings), detail: "External POST senders" },
              { label: "Inbound Events", value: formatCount(inboundEventsSettings), detail: "Received payloads" },
              { label: "Import Jobs", value: formatCount(importJobsSettings), detail: "CSV/XLSX batches" },
            ],
            rows: rowsData,
          },
          error: null,
        };
      }
      default:
        return {
          data: {
            metrics: [
              { label: "Records", value: "0", detail: "No database table wired yet" },
              { label: "Active", value: "0", detail: "Awaiting implementation" },
              { label: "Pending", value: "0", detail: "Awaiting implementation" },
              { label: "Alerts", value: "0", detail: "Awaiting implementation" },
            ],
            rows: [],
          },
          error: null,
        };
    }
  } catch (error) {
    return {
      data: {
        metrics: [
          { label: "Records", value: "0", detail: "Unable to load from database" },
          { label: "Active", value: "0", detail: "Unable to load from database" },
          { label: "Pending", value: "0", detail: "Unable to load from database" },
          { label: "Alerts", value: "0", detail: "Unable to load from database" },
        ],
        rows: [],
      },
      error:
        error instanceof Error
          ? error.message
          : JSON.stringify(error),
    };
  }
}

function displayDeviceStatus(value: unknown) {
  const status = String(value ?? "").trim();
  const normalized = status.toLowerCase();

  if (!status || normalized === "purchased" || normalized === "stock_added") {
    return "Clear";
  }

  return status.replaceAll("_", " ");
}

async function inventoryRows(supabase: SupabaseClient, searchQuery = "") {
  const trimmedSearch = searchQuery.trim();

  const buildQuery = (withSentBy: boolean) => {
    const selectFields = withSentBy
      ? "id,imei,status,custody_status,has_mic,purchase_cost,sale_price,installation_date,created_at,technician_id,technicians(name,phone,cities),customer_id,customers(full_name,phone,location),consignment_number,courier_company,sent_by_technician_id,sent_by:technicians!devices_sent_by_technician_id_fkey(name),dispatched_at,received_at"
      : "id,imei,status,custody_status,has_mic,purchase_cost,sale_price,installation_date,created_at,technician_id,technicians(name,phone,cities),customer_id,customers(full_name,phone,location),consignment_number,courier_company,dispatched_at,received_at";

    let q = supabase
      .from("devices")
      .select(selectFields)
      .order("created_at", { ascending: false });

    if (trimmedSearch) {
      const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
      q = q.or(`imei.ilike.%${escapedSearch}%`);
    }

    return q.limit(trimmedSearch ? 50 : 10);
  };

  // Try full query with sent_by join; fall back if column doesn't exist yet
  let data: Record<string, unknown>[] | null = null;
  let hasSentBy = true;

  const fullResult = await buildQuery(true);
  if (fullResult.error) {
    // Column may not exist yet — fall back to query without it
    hasSentBy = false;
    const fallbackResult = await buildQuery(false);
    if (fallbackResult.error) throw fallbackResult.error;
    data = (fallbackResult.data as unknown as Record<string, unknown>[]) ?? [];
  } else {
    data = (fullResult.data as unknown as Record<string, unknown>[]) ?? [];
  }

  const rows = data;
  const technicianIds = Array.from(
    new Set(
      rows
        .map((row) => row.technician_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
  const technicianDeviceCounts = await deviceCountsByTechnician(supabase, technicianIds);

  return rows.map((row) => {
    const technicianId = typeof row.technician_id === "string" ? row.technician_id : "";
    const sentByTechId = hasSentBy && typeof row.sent_by_technician_id === "string" ? row.sent_by_technician_id : "";
    const sentByRaw = hasSentBy ? row.sent_by as Record<string, unknown> | null : null;
    const sentByName = sentByRaw && typeof sentByRaw.name === "string" ? sentByRaw.name : "";

    return [
      String(row.id ?? ""), // 0
      String(row.status ?? "-").replaceAll("_", " "), // 1
      String(row.custody_status ?? "company_hands"), // 2
      technicianId, // 3
      String(row.imei ?? "-"), // 4
      displayDeviceStatus(row.status), // 5
      row.status === "installed" ? "Customer Hands" : String(row.custody_status ?? "company_hands").replaceAll("_", " "), // 6
      row.has_mic ? "Yes" : "No", // 7
      relatedField(row.technicians, "name") ?? "-", // 8: technician name (keep it for installed too!)
      relatedField(row.customers, "full_name") ?? "-", // 9
      relatedField(row.technicians, "cities") ?? "-", // 10
      technicianId ? formatCount(technicianDeviceCounts.get(technicianId)) : "0", // 11
      String(row.purchase_cost ?? "0"), // 12
      formatDateTime(String(row.created_at ?? "")), // 13
      relatedField(row.technicians, "phone") ?? "-", // 14: technician phone
      relatedField(row.customers, "phone") ?? "-", // 15: customer phone
      relatedField(row.customers, "location") ?? "-", // 16: customer city
      String(row.sale_price ?? "0"), // 17: sale price
      row.installation_date ? formatDate(String(row.installation_date)) : "-", // 18: installation date
      String(row.consignment_number ?? ""), // 19
      String(row.courier_company ?? ""), // 20
      sentByTechId, // 21: sent_by_technician_id
      sentByName, // 22: sent_by technician name
      String(row.dispatched_at ?? ""), // 23: dispatched_at
      String(row.received_at ?? ""), // 24: received_at
    ];
  });
}


function technicianStatus(active: unknown, disputed: unknown) {
  if (disputed) {
    return "Disputed";
  }

  return active ? "Active" : "Blocked";
}

async function technicianRows(supabase: SupabaseClient, searchQuery = "") {
  let query = supabase
    .from("technicians")
    .select("id,name,cnic,cities,phone,authorization_person_name,authorization_person_phone,authorization_person_cnic,authorization_relation,commission_rate,active,disputed,dispute_reason,created_at")
    .order("created_at", { ascending: false });

  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
    query = query.or(`name.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%,cities.ilike.%${escapedSearch}%,cnic.ilike.%${escapedSearch}%`);
  }

  const { data, error } = await query.limit(trimmedSearch ? 50 : 10);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const technicianIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);
  const [deviceCounts, toInstallCounts, queueStats, disputedCounts, assignedTasks, completedCounts, unpaidCommissions] = await Promise.all([
    deviceCountsByTechnician(supabase, technicianIds),
    workOrderCountsByTechnician(supabase, technicianIds, ["in_progress"]),
    queuedDevicesByTechnician(supabase, technicianIds),
    disputedDeviceCountsByTechnician(supabase, technicianIds),
    assignedTasksByTechnician(supabase, technicianIds),
    completedInstallCountsByTechnician(supabase, technicianIds),
    unpaidCommissionsByTechnician(supabase, technicianIds),
  ]);

  return rows.map((row) => {
    const technicianId = String(row.id ?? "");

    return [
      String(row.id ?? ""),
      row.active ? "true" : "false",
      row.disputed ? "true" : "false",
      String(row.authorization_person_cnic ?? ""),
      String(row.authorization_relation ?? ""),
      String(row.authorization_person_phone ?? ""),
      String(row.name ?? "-"),
      String(row.cnic ?? "-"),
      String(row.cities ?? "-"),
      String(row.phone ?? "-"),
      assignedTasks.get(technicianId) || "-",
      `Total ${formatCount(deviceCounts.get(technicianId))} / On Way ${formatCount(queueStats.onWay.get(technicianId))} / Received ${formatCount(queueStats.received.get(technicianId))} / Installed ${formatCount(completedCounts.get(technicianId))} / Unpaid Rs. ${formatCount(unpaidCommissions.get(technicianId))}`,
      String(row.authorization_person_name ?? "-"),
      String(row.commission_rate ?? "0"),
      technicianStatus(row.active, row.disputed),
      formatDateTime(String(row.created_at ?? "")),
      String(row.dispute_reason ?? ""),
      String(unpaidCommissions.get(technicianId) || 0),
      String(completedCounts.get(technicianId) || 0),
    ];
  });
}

async function leadRows(supabase: SupabaseClient, searchQuery = "") {
  const baseQuery = () => supabase
    .from("leads")
    .select("id,name,phone,whatsapp,source,location,vehicle_type,budget,stage,next_follow_up_at,assigned_technician_id,assigned_device_id,created_at,technicians(name),devices(imei,consignment_number,courier_company)")
    .or("assigned_technician_id.is.null,assigned_device_id.is.null")
    .order("created_at", { ascending: false });

  const trimmedSearch = searchQuery.trim();
  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
    const { data: matchingTechnicians, error: technicianSearchError } = await supabase
      .from("technicians")
      .select("id")
      .ilike("name", `%${trimmedSearch}%`)
      .limit(50);

    if (technicianSearchError) {
      throw technicianSearchError;
    }

    const technicianIds = (matchingTechnicians ?? [])
      .map((technician) => String(technician.id ?? ""))
      .filter(Boolean);

    const textQuery = baseQuery()
      .or(`name.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%`)
      .limit(50);
    const technicianQuery = technicianIds.length
      ? baseQuery().in("assigned_technician_id", technicianIds).limit(50)
      : Promise.resolve({ data: [], error: null });

    const [textResult, technicianResult] = await Promise.all([textQuery, technicianQuery]);
    error = textResult.error ?? technicianResult.error;
    data = mergeRowsById(textResult.data, technicianResult.data).slice(0, 50);
  } else {
    const result = await baseQuery().limit(10);
    data = result.data;
    error = result.error;
  }

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const techObj = row.technicians as Record<string, unknown> | null;
    const techName = techObj?.name ? String(techObj.name) : "";
    const deviceObj = row.devices as Record<string, unknown> | null;
    const deviceImei = deviceObj?.imei ? String(deviceObj.imei) : "";
    const consignmentNumber = deviceObj?.consignment_number ? String(deviceObj.consignment_number) : "";
    const courierCompany = deviceObj?.courier_company ? String(deviceObj.courier_company) : "";
    
    return [
      String(row.id ?? ""),
      String(row.stage ?? "new_lead"),
      String(row.next_follow_up_at ?? ""),
      String(row.name ?? "-"),
      String(row.phone ?? "-"),
      String(row.whatsapp ?? ""),
      String(row.source ?? ""),
      String(row.location ?? "-"),
      String(row.vehicle_type ?? "-"),
      String(row.budget ?? "0"),
      String(row.stage ?? "-").replaceAll("_", " "),
      formatDateTime(String(row.next_follow_up_at ?? "")),
      formatDateTime(String(row.created_at ?? "")),
      String(row.assigned_technician_id ?? ""),
      techName,
      String(row.assigned_device_id ?? ""),
      deviceImei,
      consignmentNumber,
      courierCompany,
    ];
  });
}

function technicianMatchScore(customerLocation: string, technician: Record<string, unknown>) {
  const locationTokens = customerLocation
    .toLowerCase()
    .split(/[,\s/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const coverageTokens = `${String(technician.cities ?? "")} ${String(technician.area_coverage ?? "")}`
    .toLowerCase()
    .split(/[,\s/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const coverage = new Set(coverageTokens);

  if (!locationTokens.length || !coverageTokens.length) {
    return 0;
  }

  return locationTokens.filter((part) => coverage.has(part)).length;
}

async function customerRows(supabase: SupabaseClient, searchQuery = "") {
  const baseQuery = () => supabase
    .from("customers")
    .select("id,full_name,phone,whatsapp,email,address,area,location,vehicle_type,budget,notes,source_lead_id,created_at,leads!source_lead_id(assigned_technician_id,assigned_device_id,technicians(name),devices(imei))")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const trimmedSearch = searchQuery.trim();
  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
    const { data: matchingTechnicians, error: technicianSearchError } = await supabase
      .from("technicians")
      .select("id")
      .ilike("name", `%${trimmedSearch}%`)
      .limit(50);

    if (technicianSearchError) {
      throw technicianSearchError;
    }

    const technicianIds = (matchingTechnicians ?? [])
      .map((technician) => String(technician.id ?? ""))
      .filter(Boolean);

    const { data: matchingLeads, error: leadSearchError } = technicianIds.length
      ? await supabase
          .from("leads")
          .select("id")
          .in("assigned_technician_id", technicianIds)
          .limit(100)
      : { data: [], error: null };

    if (leadSearchError) {
      throw leadSearchError;
    }

    const leadIds = (matchingLeads ?? [])
      .map((lead) => String(lead.id ?? ""))
      .filter(Boolean);

    const textQuery = baseQuery()
      .or(`full_name.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%,area.ilike.%${escapedSearch}%`)
      .limit(50);
    const technicianQuery = leadIds.length
      ? baseQuery().in("source_lead_id", leadIds).limit(50)
      : Promise.resolve({ data: [], error: null });

    const [textResult, technicianResult] = await Promise.all([textQuery, technicianQuery]);
    error = textResult.error ?? technicianResult.error;
    data = mergeRowsById(textResult.data, technicianResult.data).slice(0, 50);
  } else {
    const result = await baseQuery().limit(10);
    data = result.data;
    error = result.error;
  }

  const [customerResult, { data: technicians, error: technicianError }] = await Promise.all([
    Promise.resolve({ data, error }),
    supabase
      .from("technicians")
      .select("id,name,cities,area_coverage,active")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  if (customerResult.error) {
    throw customerResult.error;
  }

  if (technicianError) {
    throw technicianError;
  }

  const rows = (customerResult.data ?? []) as Record<string, unknown>[];
  const customerIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);
  const leadIds = rows.map((row) => String(row.source_lead_id ?? "")).filter(Boolean);
  const [followUpsByLead, installStatuses, assignedDevices] = await Promise.all([
    latestFollowUpsByLead(supabase, leadIds),
    installStatusByCustomer(supabase, customerIds),
    assignedDevicesByCustomer(supabase, customerIds),
  ]);
  const technicianRowsData = (technicians ?? []) as Record<string, unknown>[];

  return rows.map((row) => {
    const customerId = String(row.id ?? "");
    const location = String(row.location ?? row.area ?? row.address ?? "");
    const suggested = technicianRowsData
      .map((technician) => ({ score: technicianMatchScore(location, technician), technician }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((match) => String(match.technician.name ?? "-"))
      .join(", ");
    const nextFollowUp = followUpsByLead.get(String(row.source_lead_id ?? ""));
    const leadsData = row.leads as Record<string, unknown> | null;
    const assignedTechnicianId = leadsData?.assigned_technician_id ? String(leadsData.assigned_technician_id) : "";
    const assignedDeviceId = leadsData?.assigned_device_id ? String(leadsData.assigned_device_id) : "";
    const assignedTechnicianName = leadsData ? (relatedField(leadsData.technicians, "name") ?? "") : "";
    const leadDeviceData = leadsData?.devices as Record<string, unknown> | null;
    const leadAssignedDeviceImei = leadDeviceData?.imei ? String(leadDeviceData.imei) : "";

    return [
      customerId, // 0
      String(row.full_name ?? "-"), // 1
      String(row.phone ?? "-"), // 2
      String(row.whatsapp ?? ""), // 3
      String(row.email ?? ""), // 4
      String(row.address ?? ""), // 5
      String(row.area ?? ""), // 6
      String(row.location ?? "-"), // 7
      String(row.vehicle_type ?? "-"), // 8
      String(row.budget ?? "0"), // 9
      String(row.notes ?? ""), // 10
      suggested || "No area match", // 11
      nextFollowUp ?? "-", // 12
      formatDateTime(String(row.created_at ?? "")), // 13
      installStatuses.get(customerId)?.status ?? "none", // 14 - raw status: "completed", "pending", or "none"
      String(row.source_lead_id ?? ""), // 15
      assignedDevices.get(customerId) || leadAssignedDeviceImei || "-", // 16
      assignedTechnicianId, // 17
      assignedDeviceId, // 18
      assignedTechnicianName, // 19: technician name who installed
      installStatuses.get(customerId)?.completedAt ?? "-", // 20: installed completed_at
    ];
  });
}

async function assignedDevicesByCustomer(supabase: SupabaseClient, customerIds: string[]) {
  const devices = new Map<string, string>();
  if (!customerIds.length) return devices;
  const { data, error } = await supabase
    .from("devices")
    .select("customer_id,imei")
    .in("customer_id", customerIds);
  
  if (!error && data) {
    for (const row of data) {
      const cid = String(row.customer_id);
      const imei = String(row.imei || "Unknown Device");
      const current = devices.get(cid);
      devices.set(cid, current ? `${current}, ${imei}` : imei);
    }
  }
  return devices;
}

async function latestFollowUpsByLead(supabase: SupabaseClient, leadIds: string[]) {
  const followUps = new Map<string, string>();

  if (!leadIds.length) {
    return followUps;
  }

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .select("lead_id,next_follow_up_at")
    .in("lead_id", leadIds)
    .not("next_follow_up_at", "is", null)
    .order("next_follow_up_at", { ascending: false });

  if (error) {
    throw error;
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const leadId = String(row.lead_id ?? "");

    if (!leadId || followUps.has(leadId)) {
      continue;
    }

    followUps.set(leadId, formatDateTime(String(row.next_follow_up_at ?? "")));
  }

  return followUps;
}

async function assignedTasksByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const tasks = new Map<string, string>();
  if (!technicianIds.length) return tasks;
  
  const { data, error } = await supabase
    .from("devices")
    .select("technician_id,imei,status,customers(full_name)")
    .in("technician_id", technicianIds);
  
  if (!error && data) {
    for (const row of data) {
      if (row.status === "installed" || row.status === "active") continue;
      
      const tid = String(row.technician_id);
      const imei = String(row.imei || "Unknown Device");
      const customerName = relatedField(row.customers, "full_name");
      const status = String(row.status || "").replaceAll("_", " ");
      
      const taskDesc = customerName ? `${imei} (For: ${customerName}) - ${status}` : `${imei} - ${status}`;
      const current = tasks.get(tid);
      tasks.set(tid, current ? `${current}\n${taskDesc}` : taskDesc);
    }
  }
  return tasks;
}

async function deviceCountsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("devices")
    .select("technician_id")
    .in("custody_status", ["technician_hands", "received_by_technician", "on_the_way"])
    .in("technician_id", technicianIds);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    counts.set(technicianId, (counts.get(technicianId) ?? 0) + 1);
  }

  return counts;
}

async function queuedDevicesByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const onWayCounts = new Map<string, number>();
  const receivedCounts = new Map<string, number>();

  if (!technicianIds.length) {
    return { onWay: onWayCounts, received: receivedCounts };
  }

  const { data, error } = await supabase
    .from("devices")
    .select("technician_id, custody_status")
    .in("technician_id", technicianIds)
    .is("customer_id", null);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    if (row.custody_status === "on_the_way") {
      onWayCounts.set(technicianId, (onWayCounts.get(technicianId) ?? 0) + 1);
    } else if (row.custody_status === "received_by_technician") {
      receivedCounts.set(technicianId, (receivedCounts.get(technicianId) ?? 0) + 1);
    }
  }

  return { onWay: onWayCounts, received: receivedCounts };
}

async function disputedDeviceCountsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("devices")
    .select("technician_id")
    .in("technician_id", technicianIds)
    .in("status", ["disputed", "fault", "faulty", "issue", "returned", "replaced"]);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    counts.set(technicianId, (counts.get(technicianId) ?? 0) + 1);
  }

  return counts;
}

async function workOrderCountsByTechnician(
  supabase: SupabaseClient,
  technicianIds: string[],
  statuses: string[],
) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("work_orders")
    .select("technician_id")
    .in("technician_id", technicianIds)
    .in("status", statuses);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const technicianId = String(row.technician_id);
    counts.set(technicianId, (counts.get(technicianId) ?? 0) + 1);
  }

  return counts;
}

async function moduleQuery(supabase: SupabaseClient, table: string, columns: string[], searchQuery = "") {
  const count = await countRows(supabase, table);

  return {
    data: {
      metrics: [
        { label: "Records", value: formatCount(count), detail: `Rows in ${table}` },
        { label: "Active", value: "-", detail: "Table-specific rule pending" },
        { label: "Pending", value: "-", detail: "Table-specific rule pending" },
        { label: "Alerts", value: "-", detail: "Table-specific rule pending" },
      ],
      rows: await tableRows(supabase, table, columns, searchQuery),
    },
    error: null,
  };
}

async function tableRows(supabase: SupabaseClient, table: string, columns: string[], searchQuery = "") {
  let query = supabase
    .from(table)
    .select(columns.join(","))
    .order("created_at", { ascending: false });

  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
    const searchableCols = columns.filter(c => !["status", "custody_status", "created_at", "active", "paid", "direction", "priority"].includes(c));
    if (searchableCols.length > 0) {
      const searchFilters = searchableCols.map(col => `${col}.ilike.%${escapedSearch}%`).join(",");
      query = query.or(searchFilters);
    }
  }

  const { data, error } = await query.limit(trimmedSearch ? 50 : 10);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    columns.map((column) => {
      const value = row[column as keyof typeof row];

      if (value === null || value === undefined || value === "") {
        return "-";
      }

      if (column.includes("_at")) {
        return formatDateTime(String(value));
      }

      if (column.includes("_on") || column.includes("date")) {
        return formatDate(String(value));
      }

      return String(value);
    }),
  );
}

async function installStatusByCustomer(supabase: SupabaseClient, customerIds: string[]) {
  const statusMap = new Map<string, { status: string; completedAt: string }>();
  if (!customerIds.length) return statusMap;

  const { data, error } = await supabase
    .from("work_orders")
    .select("customer_id,status,completed_at")
    .in("customer_id", customerIds);

  if (!error && data) {
    for (const row of data) {
      const cid = String(row.customer_id);
      const current = statusMap.get(cid);
      const completedAtStr = row.completed_at ? formatDateTime(String(row.completed_at)) : "-";
      if (row.status === "assigned" || row.status === "in_progress") {
        statusMap.set(cid, { status: "pending", completedAt: "-" });
      } else if (row.status === "completed" && (!current || current.status !== "pending")) {
        statusMap.set(cid, { status: "completed", completedAt: completedAtStr });
      }
    }
  }
  return statusMap;
}

async function completedInstallCountsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const counts = new Map<string, number>();

  if (!technicianIds.length) {
    return counts;
  }

  const { data, error } = await supabase
    .from("work_orders")
    .select("technician_id")
    .in("technician_id", technicianIds)
    .eq("status", "completed");

  if (!error && data) {
    for (const row of data) {
      const tid = String(row.technician_id);
      counts.set(tid, (counts.get(tid) ?? 0) + 1);
    }
  }

  return counts;
}

async function unpaidCommissionsByTechnician(supabase: SupabaseClient, technicianIds: string[]) {
  const amounts = new Map<string, number>();

  if (!technicianIds.length) {
    return amounts;
  }

  const { data, error } = await supabase
    .from("commissions")
    .select("technician_id,amount")
    .in("technician_id", technicianIds)
    .eq("paid", false);

  if (!error && data) {
    for (const row of data) {
      const tid = String(row.technician_id);
      const amount = Number(row.amount) || 0;
      amounts.set(tid, (amounts.get(tid) ?? 0) + amount);
    }
  }

  return amounts;
}


