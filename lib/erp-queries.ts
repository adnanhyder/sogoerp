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
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
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
  return moneyFormatter.format(value);
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
      { label: "Active Devices", value: "0", detail: "0 total devices" },
      { label: "Monthly Sales", value: "$0", detail: "$0 expenses" },
      { label: "Pending Installs", value: "0", detail: "0 work orders total" },
      { label: "Open Tickets", value: "0", detail: "0 support tickets total" },
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
      {
        title: "Finance Pulse",
        rows: [
          ["Revenue", "$0"],
          ["Expenses", "$0"],
          ["Commissions", "$0"],
          ["Net Profit", "$0"],
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
      activeDevices,
      totalDevices,
      totalVehicles,
      pendingInstalls,
      totalWorkOrders,
      openTickets,
      totalTickets,
      monthlyIncome,
      monthlyExpenses,
      totalCommissions,
      purchasedDevices,
      approvedDevices,
      techDevices,
      installedDevices,
      assignedToday,
      completedToday,
      awaitingProof,
      totalLeads,
    ] = await Promise.all([
      countRows(supabase, "devices", (query) => query.eq("status", "active")),
      countRows(supabase, "devices"),
      countRows(supabase, "vehicles"),
      countRows(supabase, "work_orders", (query) =>
        query.in("status", ["assigned", "scheduled", "in_progress"]),
      ),
      countRows(supabase, "work_orders"),
      countRows(supabase, "support_tickets", (query) =>
        query.in("status", ["open", "in_progress"]),
      ),
      countRows(supabase, "support_tickets"),
      sumFinance(supabase, "income", monthStart),
      sumFinance(supabase, "expense", monthStart),
      sumCommissions(supabase),
      countRows(supabase, "devices", (query) => query.eq("status", "purchased")),
      countRows(supabase, "devices", (query) => query.eq("status", "imei_approved")),
      countRows(supabase, "devices", (query) =>
        query.in("status", ["assigned_to_courier", "received_by_technician"]),
      ),
      countRows(supabase, "devices", (query) =>
        query.in("status", ["installed", "activated_with_sim", "active"]),
      ),
      countRows(supabase, "work_orders", (query) =>
        query.gte("created_at", todayStart).lt("created_at", tomorrowStart),
      ),
      countRows(supabase, "work_orders", (query) =>
        query.eq("status", "completed").gte("completed_at", todayStart).lt("completed_at", tomorrowStart),
      ),
      countRows(supabase, "work_orders", (query) =>
        query.eq("status", "completed").or("before_image_url.is.null,after_image_url.is.null"),
      ),
      countRows(supabase, "leads"),
    ]);

    const leadStages = await Promise.all([
      countRows(supabase, "leads", (query) => query.eq("stage", "new_lead")),
      countRows(supabase, "leads", (query) => query.eq("stage", "contacted")),
      countRows(supabase, "leads", (query) => query.eq("stage", "negotiation")),
      countRows(supabase, "leads", (query) => query.eq("stage", "installation_scheduled")),
      countRows(supabase, "leads", (query) => query.eq("stage", "installed")),
    ]);

    const { data: operationsData, error: operationsError } = await supabase
      .from("work_orders")
      .select("id,status,scheduled_at,created_at,customers(full_name),devices(imei)")
      .order("created_at", { ascending: false })
      .limit(8);

    if (operationsError) {
      throw operationsError;
    }

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
    const netProfit = monthlyIncome - monthlyExpenses - totalCommissions;

    return {
      data: {
        bars: leadStages.map((count) =>
          totalLeads ? Math.max(6, Math.round((count / totalLeads) * 100)) : 0,
        ),
        chartSeries: {
          primary: [
            purchasedDevices,
            approvedDevices,
            techDevices,
            pendingInstalls,
            assignedToday,
            completedToday,
            installedDevices,
            activeDevices,
          ],
          secondary: [
            totalLeads,
            leadStages[0] ?? 0,
            leadStages[1] ?? 0,
            leadStages[2] ?? 0,
            leadStages[3] ?? 0,
            leadStages[4] ?? 0,
            openTickets,
            totalVehicles,
          ],
        },
        kpis: [
          {
            label: "Active Devices",
            value: formatCount(activeDevices),
            detail: `${formatCount(totalDevices)} total devices`,
          },
          {
            label: "Monthly Sales",
            value: formatMoney(monthlyIncome),
            detail: `${formatMoney(monthlyExpenses)} expenses`,
          },
          {
            label: "Pending Installs",
            value: formatCount(pendingInstalls),
            detail: `${formatCount(totalWorkOrders)} work orders total`,
          },
          {
            label: "Open Tickets",
            value: formatCount(openTickets),
            detail: `${formatCount(totalTickets)} support tickets total`,
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
              ["SLA Risk", "0"],
            ],
          },
          {
            title: "Finance Pulse",
            rows: [
              ["Revenue", formatMoney(monthlyIncome)],
              ["Expenses", formatMoney(monthlyExpenses)],
              ["Commissions", formatMoney(totalCommissions)],
              ["Net Profit", formatMoney(netProfit)],
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

async function sumCommissions(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("commissions").select("amount").eq("paid", false);

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
      case "inventory":
        return {
          data: {
            metrics: [
              { label: "Total Stock", value: formatCount(await countRows(supabase, "devices")), detail: "All device records" },
              { label: "Company Hands", value: formatCount(await countRows(supabase, "devices", (query) => query.eq("custody_status", "company_hands"))), detail: "Devices still with company" },
              { label: "On The Way", value: formatCount(await countRows(supabase, "devices", (query) => query.eq("custody_status", "on_the_way"))), detail: "Courier / technician handoff" },
              { label: "With Technicians", value: formatCount(await countRows(supabase, "devices", (query) => query.eq("custody_status", "received_by_technician"))), detail: "Received by technicians" },
              { label: "Faulty", value: formatCount(await countRows(supabase, "devices", (query) => query.eq("status", "faulty"))), detail: "Pending replacement" },
            ],
            rows: await inventoryRows(supabase, options.searchQuery),
          },
          error: null,
        };
      case "integrations":
        return {
          data: {
            metrics: [
              { label: "API Sources", value: formatCount(await countRows(supabase, "api_sources")), detail: "External apps registered" },
              { label: "Inbound Events", value: formatCount(await countRows(supabase, "inbound_events")), detail: "Payloads received" },
              { label: "Import Jobs", value: formatCount(await countRows(supabase, "import_jobs")), detail: "CSV/XLSX batches" },
              { label: "Export Jobs", value: formatCount(await countRows(supabase, "export_jobs")), detail: "Generated files" },
            ],
            rows: await tableRows(supabase, "api_sources", ["name", "source_key", "active", "created_at"]),
          },
          error: null,
        };
      case "leads":
        return {
          data: {
            metrics: [
              { label: "New Leads", value: formatCount(await countRows(supabase, "leads", (query) => query.eq("stage", "new_lead"))), detail: "Fresh inquiries" },
              { label: "Follow-ups Due", value: formatCount(await countRows(supabase, "leads", (query) => query.lte("next_follow_up_at", new Date().toISOString()))), detail: "Due now or overdue" },
              { label: "Matured Leads", value: formatCount(await countRows(supabase, "leads", (query) => query.eq("stage", "matured"))), detail: "Ready to schedule" },
              { label: "Total Leads", value: formatCount(await countRows(supabase, "leads")), detail: "All lead records" },
            ],
            rows: await tableRows(supabase, "leads", ["name", "source", "stage", "phone", "next_follow_up_at", "created_at"]),
          },
          error: null,
        };
      case "technicians":
        return {
          data: {
            metrics: [
              { label: "Technicians", value: formatCount(await countRows(supabase, "technicians")), detail: "All technician records" },
              { label: "Active", value: formatCount(await countRows(supabase, "technicians", (query) => query.eq("active", true))), detail: "Allowed to receive work" },
              { label: "Blocked", value: formatCount(await countRows(supabase, "technicians", (query) => query.eq("active", false))), detail: "Access blocked" },
              { label: "Disputed", value: formatCount(await countRows(supabase, "technicians", (query) => query.eq("disputed", true))), detail: "Marked for review" },
            ],
            rows: await technicianRows(supabase),
          },
          error: null,
        };
      case "customers":
        return moduleQuery(supabase, "customers", ["full_name", "phone", "whatsapp", "area", "created_at"]);
      case "simConfig":
        return moduleQuery(supabase, "sims", ["sim_number", "network_provider", "apn_settings", "activation_date", "active"]);
      case "finance":
        return moduleQuery(supabase, "finance_entries", ["category", "entry_type", "amount", "occurred_on", "note"]);
      case "commissions":
        return moduleQuery(supabase, "commissions", ["reason", "amount", "paid", "created_at"]);
      case "whatsapp":
        return moduleQuery(supabase, "communication_logs", ["channel", "direction", "message", "created_at"]);
      case "support":
        return moduleQuery(supabase, "support_tickets", ["title", "priority", "status", "created_at"]);
      case "documents":
        return moduleQuery(supabase, "documents", ["document_type", "file_url", "created_at"]);
      case "insurance":
        return moduleQuery(supabase, "insurance_policies", ["customer_name", "policy_name", "premium", "end_date", "status"]);
      case "reports":
        return moduleQuery(supabase, "report_definitions", ["name", "focus", "owner", "frequency", "status"]);
      case "tracking":
        return moduleQuery(supabase, "tracking_events", ["entity", "location", "signal", "last_update", "status"]);
      case "settings":
        return {
          data: {
            metrics: [
              { label: "Settings", value: formatCount(await countRows(supabase, "settings_items")), detail: "Configuration records" },
              { label: "API Sources", value: formatCount(await countRows(supabase, "api_sources")), detail: "External POST senders" },
              { label: "Inbound Events", value: formatCount(await countRows(supabase, "inbound_events")), detail: "Received payloads" },
              { label: "Import Jobs", value: formatCount(await countRows(supabase, "import_jobs")), detail: "CSV/XLSX batches" },
            ],
            rows: await tableRows(supabase, "settings_items", ["name", "area", "owner", "created_at", "status"]),
          },
          error: null,
        };
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
          : "Unable to load module data from Supabase.",
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
  let query = supabase
    .from("devices")
    .select("id,imei,status,custody_status,has_mic,purchase_cost,created_at")
    .order("created_at", { ascending: false });

  const trimmedSearch = searchQuery.trim();

  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replaceAll(",", "\\,");
    query = query.or(
      `imei.ilike.%${escapedSearch}%,status.ilike.%${escapedSearch}%,custody_status.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query.limit(trimmedSearch ? 50 : 10);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => [
      String(row.id ?? ""),
      String(row.status ?? "-").replaceAll("_", " "),
      String(row.custody_status ?? "company_hands"),
      String(row.imei ?? "-"),
      displayDeviceStatus(row.status),
      String(row.custody_status ?? "company_hands").replaceAll("_", " "),
      row.has_mic ? "Yes" : "No",
      String(row.purchase_cost ?? "0"),
      formatDateTime(String(row.created_at ?? "")),
    ]);
}

function technicianStatus(active: unknown, disputed: unknown) {
  if (disputed) {
    return "Disputed";
  }

  return active ? "Active" : "Blocked";
}

async function technicianRows(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("technicians")
    .select("id,name,cnic,cities,phone,authorization_person_name,authorization_person_phone,authorization_person_cnic,authorization_relation,commission_rate,active,disputed,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => [
    String(row.id ?? ""),
    row.active ? "true" : "false",
    row.disputed ? "true" : "false",
    String(row.authorization_person_cnic ?? ""),
    String(row.authorization_relation ?? ""),
    String(row.name ?? "-"),
    String(row.cnic ?? "-"),
    String(row.cities ?? "-"),
    String(row.phone ?? "-"),
    String(row.authorization_person_name ?? "-"),
    String(row.authorization_person_phone ?? "-"),
    String(row.commission_rate ?? "0"),
    technicianStatus(row.active, row.disputed),
    formatDateTime(String(row.created_at ?? "")),
  ]);
}

async function moduleQuery(supabase: SupabaseClient, table: string, columns: string[]) {
  const count = await countRows(supabase, table);

  return {
    data: {
      metrics: [
        { label: "Records", value: formatCount(count), detail: `Rows in ${table}` },
        { label: "Active", value: "-", detail: "Table-specific rule pending" },
        { label: "Pending", value: "-", detail: "Table-specific rule pending" },
        { label: "Alerts", value: "-", detail: "Table-specific rule pending" },
      ],
      rows: await tableRows(supabase, table, columns),
    },
    error: null,
  };
}

async function tableRows(supabase: SupabaseClient, table: string, columns: string[]) {
  const { data, error } = await supabase
    .from(table)
    .select(columns.join(","))
    .order("created_at", { ascending: false })
    .limit(10);

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
