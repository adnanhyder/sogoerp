import { Client } from "pg";

type RestModuleConfig = {
  defaultOrder?: string;
  fields: string[];
  searchable?: string[];
  table: string;
};

export const restModules = {
  commissions: {
    fields: ["reason", "amount", "paid", "technician_id", "work_order_id", "created_at"],
    searchable: ["reason"],
    table: "commissions",
  },
  customers: {
    fields: ["full_name", "phone", "whatsapp", "email", "address", "area", "location", "vehicle_type", "budget", "notes", "created_at"],
    searchable: ["full_name", "phone", "whatsapp", "location", "area"],
    table: "customers",
  },
  documents: {
    fields: ["customer_id", "work_order_id", "document_type", "file_url", "created_at"],
    searchable: ["document_type", "file_url"],
    table: "documents",
  },
  finance: {
    fields: ["entry_type", "category", "amount", "note", "occurred_on", "related_customer_id", "related_work_order_id", "created_at"],
    searchable: ["category", "note"],
    table: "finance_entries",
  },
  insurance: {
    fields: ["customer_id", "customer_name", "policy_name", "start_date", "end_date", "status", "premium", "created_at"],
    searchable: ["customer_name", "policy_name", "status"],
    table: "insurance_policies",
  },
  integrations: {
    fields: ["name", "source_key", "allowed_events", "active", "created_at"],
    searchable: ["name", "source_key"],
    table: "api_sources",
  },
  inventory: {
    fields: ["imei", "purchase_cost", "sale_price", "status", "has_mic", "custody_status", "custody_updated_at", "technician_id", "customer_id", "vehicle_id", "sim_id", "installation_date", "warranty_until", "server_configuration", "created_at"],
    searchable: ["imei", "status", "custody_status"],
    table: "devices",
  },
  leads: {
    fields: ["name", "phone", "whatsapp", "source", "location", "vehicle_type", "budget", "stage", "next_follow_up_at", "created_at"],
    searchable: ["name", "phone", "whatsapp", "source", "location"],
    table: "leads",
  },
  reports: {
    fields: ["name", "focus", "owner", "frequency", "status", "created_at"],
    searchable: ["name", "focus", "owner", "status"],
    table: "report_definitions",
  },
  settings: {
    fields: ["name", "area", "owner", "status", "created_at"],
    searchable: ["name", "area", "owner", "status"],
    table: "settings_items",
  },
  "sim-config": {
    fields: ["sim_number", "network_provider", "apn_settings", "password", "activation_date", "active", "created_at"],
    searchable: ["sim_number", "network_provider"],
    table: "sims",
  },
  sims: {
    fields: ["sim_number", "network_provider", "apn_settings", "password", "activation_date", "active", "created_at"],
    searchable: ["sim_number", "network_provider"],
    table: "sims",
  },
  support: {
    fields: ["customer_id", "device_id", "title", "status", "priority", "assigned_to", "created_at"],
    searchable: ["title", "priority", "status"],
    table: "support_tickets",
  },
  technicians: {
    fields: ["name", "cnic", "phone", "area_coverage", "cities", "authorization_person_name", "authorization_person_phone", "authorization_person_cnic", "authorization_relation", "commission_rate", "disputed", "active", "created_at"],
    searchable: ["name", "phone", "cities", "area_coverage"],
    table: "technicians",
  },
  tracking: {
    fields: ["entity", "location", "signal", "last_update", "status", "created_at"],
    searchable: ["entity", "location", "signal", "status"],
    table: "tracking_events",
  },
  vehicles: {
    fields: ["customer_id", "registration_number", "vehicle_type", "make_model", "created_at"],
    searchable: ["registration_number", "vehicle_type", "make_model"],
    table: "vehicles",
  },
  whatsapp: {
    fields: ["lead_id", "customer_id", "channel", "direction", "message", "sent_by", "created_at"],
    searchable: ["message", "channel", "direction"],
    table: "communication_logs",
  },
} as const satisfies Record<string, RestModuleConfig>;

export type RestModuleKey = keyof typeof restModules;

export type RestApiContext = {
  allowedEvents: string[];
  organizationId: string;
  sourceName: string;
};

export function getRestModule(module: string): RestModuleConfig | undefined {
  return restModules[module as RestModuleKey];
}

export function getApiKey(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return request.headers.get("x-api-key") ?? bearer ?? "";
}

export function allowedFields(config: RestModuleConfig, values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => config.fields.includes(key) && value !== undefined),
  );
}

export function assertEventAllowed(context: RestApiContext, moduleKey: string, action: string) {
  const eventName = `${moduleKey}.${action}`;

  if (context.allowedEvents.length && !context.allowedEvents.includes(eventName)) {
    throw new Error(`API key is not allowed to perform ${eventName}.`);
  }
}

export async function createDbClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing.");
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  return client;
}

export async function getRestApiContext(client: Client, request: Request): Promise<RestApiContext> {
  const apiKey = getApiKey(request);

  if (!apiKey) {
    throw new Error("Missing API key. Send x-api-key or Authorization: Bearer <key>.");
  }

  const { rows } = await client.query<{
    allowed_events: string[];
    name: string;
    organization_id: string | null;
  }>(
    "select name, organization_id, allowed_events from public.api_sources where source_key = $1 and active = true limit 1",
    [apiKey],
  );

  const source = rows[0];

  if (!source?.organization_id) {
    throw new Error("Invalid API key or API source has no organization.");
  }

  return {
    allowedEvents: source.allowed_events ?? [],
    organizationId: source.organization_id,
    sourceName: source.name,
  };
}

export async function logInboundEvent(
  client: Client,
  context: RestApiContext,
  moduleKey: string,
  action: string,
  payload: unknown,
) {
  await client.query(
    `insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
     values ($1, $2, $3, $4::jsonb, 'processed', now())`,
    [context.organizationId, context.sourceName, `${moduleKey}.${action}`, JSON.stringify(payload ?? {})],
  );
}

export function jsonError(error: unknown, status = 400) {
  return Response.json(
    { error: error instanceof Error ? error.message : "REST API request failed." },
    { status },
  );
}
