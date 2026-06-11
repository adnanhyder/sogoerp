export type CreateField = {
  label: string;
  name: string;
  options?: readonly string[];
  required?: boolean;
  type: "checkbox" | "customer-select" | "date" | "datetime-local" | "number" | "select" | "technician-select" | "text";
};

export type CreateConfig = {
  fields: readonly CreateField[];
  moduleKey: string;
  table: string;
};

export const createConfigs = {
  commissions: {
    moduleKey: "commissions",
    table: "commissions",
    fields: [
      { label: "Reason", name: "reason", required: true, type: "text" },
      { label: "Amount", name: "amount", required: true, type: "number" },
      { label: "Technician", name: "technician_id", type: "technician-select" },
      { label: "Work Order ID", name: "work_order_id", type: "text" },
      { label: "Paid", name: "paid", type: "checkbox" },
    ],
  },
  customers: {
    moduleKey: "customers",
    table: "customers",
    fields: [
      { label: "Full Name", name: "full_name", required: true, type: "text" },
      { label: "Phone", name: "phone", type: "text" },
      { label: "WhatsApp", name: "whatsapp", type: "text" },
      { label: "Email", name: "email", type: "text" },
      { label: "Address", name: "address", type: "text" },
      { label: "Area", name: "area", type: "text" },
      { label: "Location / City", name: "location", type: "text" },
      { label: "Vehicle Type", name: "vehicle_type", type: "text" },
      { label: "Budget", name: "budget", type: "number" },
      { label: "Admin Notes", name: "notes", type: "text" },
      { label: "Created Date & Time", name: "created_at", type: "datetime-local" },
    ],
  },
  documents: {
    moduleKey: "documents",
    table: "documents",
    fields: [
      { label: "Document Type", name: "document_type", required: true, type: "text" },
      { label: "File URL", name: "file_url", required: true, type: "text" },
    ],
  },
  finance: {
    moduleKey: "finance",
    table: "finance_entries",
    fields: [
      {
        label: "Type",
        name: "entry_type",
        options: ["income", "expense"],
        required: true,
        type: "select",
      },
      { label: "Category", name: "category", required: true, type: "text" },
      { label: "Amount", name: "amount", required: true, type: "number" },
      { label: "Date", name: "occurred_on", type: "date" },
      { label: "Note", name: "note", type: "text" },
    ],
  },
  inventory: {
    moduleKey: "inventory",
    table: "devices",
    fields: [
      { label: "IMEI", name: "imei", required: true, type: "text" },
      { label: "Device Status", name: "status", type: "text" },
      {
        label: "Custody",
        name: "custody_status",
        options: ["company_hands", "on_the_way", "received_by_technician", "customer_hands", "returned"],
        required: true,
        type: "select",
      },
      { label: "Purchase Cost", name: "purchase_cost", type: "number" },
      { label: "With Mic", name: "has_mic", type: "checkbox" },
      { label: "Added Date & Time", name: "created_at", type: "datetime-local" },
    ],
  },
  integrations: {
    moduleKey: "integrations",
    table: "api_sources",
    fields: [
      { label: "Source Name", name: "name", required: true, type: "text" },
      { label: "Source Key", name: "source_key", required: true, type: "text" },
      { label: "Active", name: "active", type: "checkbox" },
    ],
  },
  leads: {
    moduleKey: "leads",
    table: "leads",
    fields: [
      { label: "Lead Name", name: "name", required: true, type: "text" },
      { label: "Phone", name: "phone", type: "text" },
      { label: "WhatsApp", name: "whatsapp", type: "text" },
      { label: "Source", name: "source", type: "text" },
      { label: "Client Location / Area", name: "location", type: "text" },
      { label: "Vehicle Type", name: "vehicle_type", type: "text" },
      { label: "Budget", name: "budget", type: "number" },
      {
        label: "Stage",
        name: "stage",
        options: [
          "new_lead",
          "contacted",
          "interested",
          "negotiation",
          "matured",
          "installation_scheduled",
          "installed",
          "lost",
        ],
        type: "select",
      },
      { label: "Created Date & Time", name: "created_at", type: "datetime-local" },
    ],
  },
  simConfig: {
    moduleKey: "simConfig",
    table: "sims",
    fields: [
      { label: "SIM Number", name: "sim_number", required: true, type: "text" },
      { label: "Network Provider", name: "network_provider", type: "text" },
      { label: "APN Settings", name: "apn_settings", type: "text" },
      { label: "Activation Date", name: "activation_date", type: "date" },
    ],
  },
  support: {
    moduleKey: "support",
    table: "support_tickets",
    fields: [
      { label: "Title", name: "title", required: true, type: "text" },
      { label: "Priority", name: "priority", options: ["normal", "high"], type: "select" },
      {
        label: "Status",
        name: "status",
        options: ["open", "in_progress", "resolved", "closed"],
        type: "select",
      },
    ],
  },
  technicians: {
    moduleKey: "technicians",
    table: "technicians",
    fields: [
      { label: "Name", name: "name", required: true, type: "text" },
      { label: "Technician CNIC", name: "cnic", type: "text" },
      { label: "Phone", name: "phone", type: "text" },
      { label: "Area Coverage", name: "area_coverage", type: "text" },
      { label: "Cities", name: "cities", type: "text" },
      { label: "Commission Rate", name: "commission_rate", type: "number" },
      { label: "Authorization Person Name", name: "authorization_person_name", type: "text" },
      { label: "Authorization Person Phone", name: "authorization_person_phone", type: "text" },
      { label: "Authorization Person CNIC", name: "authorization_person_cnic", type: "text" },
      { label: "Relation With Technician", name: "authorization_relation", type: "text" },
      { label: "Created Date & Time", name: "created_at", type: "datetime-local" },
    ],
  },
  insurance: {
    moduleKey: "insurance",
    table: "insurance_policies",
    fields: [
      { label: "Customer", name: "customer_id", required: true, type: "customer-select" },
      { label: "Policy Name", name: "policy_name", required: true, type: "text" },
      { label: "Start Date", name: "start_date", type: "date" },
      { label: "End Date", name: "end_date", type: "date" },
      { label: "Premium", name: "premium", type: "number" },
      {
        label: "Status",
        name: "status",
        options: ["active", "renewal_due", "expired"],
        type: "select",
      },
    ],
  },
  reports: {
    moduleKey: "reports",
    table: "report_definitions",
    fields: [
      { label: "Report Name", name: "name", required: true, type: "text" },
      { label: "Focus", name: "focus", type: "text" },
      { label: "Owner", name: "owner", type: "text" },
      {
        label: "Frequency",
        name: "frequency",
        options: ["daily", "weekly", "monthly"],
        type: "select",
      },
      { label: "Status", name: "status", options: ["draft", "ready"], type: "select" },
    ],
  },
  settings: {
    moduleKey: "settings",
    table: "settings_items",
    fields: [
      { label: "Setting Name", name: "name", required: true, type: "text" },
      { label: "Area", name: "area", type: "text" },
      { label: "Owner", name: "owner", type: "text" },
      { label: "Status", name: "status", options: ["active", "draft"], type: "select" },
    ],
  },
  tracking: {
    moduleKey: "tracking",
    table: "tracking_events",
    fields: [
      { label: "Entity", name: "entity", required: true, type: "text" },
      { label: "Location", name: "location", type: "text" },
      { label: "Signal", name: "signal", type: "text" },
      { label: "Status", name: "status", options: ["active", "review", "late"], type: "select" },
    ],
  },
  whatsapp: {
    moduleKey: "whatsapp",
    table: "communication_logs",
    fields: [
      { label: "Channel", name: "channel", options: ["whatsapp"], type: "select" },
      { label: "Direction", name: "direction", options: ["inbound", "outbound"], required: true, type: "select" },
      { label: "Message", name: "message", required: true, type: "text" },
    ],
  },
} as const;

export type CreateModuleKey = keyof typeof createConfigs;
