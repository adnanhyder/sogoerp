export const moduleConfigs = {
  inventory: {
    title: "Inventory & Devices",
    activeHref: "/inventory",
    primaryAction: "Add Device",
    description:
      "Track every GPS tracker from supplier purchase to IMEI approval, technician handoff, installation, SIM activation, warranty, replacement, and return.",
    metrics: [
      { label: "Total Stock", value: "1,284", detail: "186 newly purchased" },
      { label: "Available", value: "642", detail: "Ready for assignment" },
      { label: "In Transit", value: "38", detail: "Courier / technician handoff" },
      { label: "Faulty", value: "17", detail: "Pending replacement" },
    ],
    tableColumns: ["IMEI", "Device Status", "Custody", "Mic", "Purchase Cost", "Added At", "Actions"],
    tableRows: [
      ["865742091234567", "IMEI Approved", "Unassigned", "-", "-"],
      ["865742091234611", "With Technician", "Hamza Field", "-", "-"],
      ["865742091234688", "Active", "Ali Raza", "Metro Fleet", "Jazz 0301"],
    ],
    workflows: [
      "Purchase devices from supplier and enter warehouse stock.",
      "Register IMEI and mark approved after system verification.",
      "Assign device to courier or technician for installation.",
      "Link installed device to customer, vehicle, SIM, images, and warranty.",
    ],
  },
  leads: {
    title: "Lead Management",
    activeHref: "/leads",
    primaryAction: "Create Lead",
    description:
      "Manage sales pipeline from Facebook, WhatsApp, calls, referrals, and web inquiries with follow-up reminders and conversion probability.",
    metrics: [
      { label: "New Leads", value: "84", detail: "27 from WhatsApp" },
      { label: "Follow-ups Due", value: "31", detail: "9 overdue" },
      { label: "Matured Leads", value: "18", detail: "Ready to schedule" },
      { label: "Conversion", value: "24%", detail: "+3.1% this month" },
    ],
    tableColumns: ["Lead", "Source", "Stage", "Phone", "Next Follow-up", "Created At"],
    tableRows: [
      ["Ahmed Transport", "Facebook Ads", "Interested", "Sara Sales", "Today 4:00 PM"],
      ["Zain Courier", "WhatsApp", "Negotiation", "Usman Sales", "Tomorrow"],
      ["City Cab", "Direct Call", "Installation Scheduled", "Sara Sales", "Jun 11"],
    ],
    workflows: [
      "Capture lead source, phone, WhatsApp, location, vehicle type, and budget.",
      "Assign salesperson and schedule next follow-up.",
      "Log calls and WhatsApp messages against the lead profile.",
      "Convert matured lead into customer, vehicle, work order, and invoice.",
    ],
  },
  technicians: {
    title: "Technician Operations",
    activeHref: "/technicians",
    primaryAction: "Add Technician",
    description:
      "Assign installation jobs, monitor area coverage, capture installation proof, GPS stamps, and calculate technician performance.",
    metrics: [
      { label: "Active Techs", value: "16", detail: "12 available today" },
      { label: "Jobs Assigned", value: "42", detail: "16 due today" },
      { label: "Proof Pending", value: "08", detail: "Need images/signature" },
      { label: "Avg Install Time", value: "52m", detail: "Across this week" },
    ],
    tableColumns: ["Technician", "Area", "Phone", "Commission", "Active", "Created At"],
    tableRows: [
      ["Ali Raza", "Johar / Gulshan", "07", "$12/install", "Active"],
      ["Hamza Field", "Korangi", "05", "$10/install", "On route"],
      ["Noman Tech", "North Karachi", "03", "$12/install", "Available"],
    ],
    workflows: [
      "Assign installation with customer, vehicle, device, and schedule.",
      "Technician uploads before/after images and customer signature.",
      "Capture GPS stamp, timestamp, and activation confirmation.",
      "Mark job complete and trigger commission calculation.",
    ],
  },
  customers: {
    title: "Customer Management",
    activeHref: "/customers",
    primaryAction: "Add Customer",
    description:
      "Maintain permanent customer records with vehicles, installed devices, SIM details, payments, warranty, support tickets, and reminders.",
    metrics: [
      { label: "Customers", value: "1,284", detail: "+12 this week" },
      { label: "Vehicles", value: "3,920", detail: "Multi-vehicle accounts" },
      { label: "Renewals Due", value: "64", detail: "Next 30 days" },
      { label: "Open Tickets", value: "28", detail: "6 high priority" },
    ],
    tableColumns: ["Customer", "Phone", "WhatsApp", "Area", "Created At"],
    tableRows: [
      ["Metro Fleet", "0300-1111111", "42", "865742091234688", "Active"],
      ["Al Noor Logistics", "0312-2222222", "18", "Pending Install", "N/A"],
      ["City Cargo", "0321-3333333", "09", "865742091234611", "Active"],
    ],
    workflows: [
      "Create customer after lead conversion or direct onboarding.",
      "Attach vehicles, devices, SIMs, installation history, and invoices.",
      "Track warranty, support tickets, and renewal reminders.",
      "Automate welcome, maintenance, renewal, and monthly check-in messages.",
    ],
  },
  simConfig: {
    title: "SIM & Device Config",
    activeHref: "/sim-config",
    primaryAction: "Add SIM",
    description:
      "Centralize SIM numbers, networks, APN settings, passwords, device credentials, server configuration, and activation dates.",
    metrics: [
      { label: "Active SIMs", value: "3,774", detail: "Across all networks" },
      { label: "Unassigned SIMs", value: "126", detail: "Ready for devices" },
      { label: "APN Profiles", value: "07", detail: "Provider templates" },
      { label: "Config Issues", value: "11", detail: "Needs support review" },
    ],
    tableColumns: ["SIM", "Network", "APN", "Linked Device", "Status"],
    tableRows: [
      ["0301-5557788", "Jazz", "jazzconnect", "865742091234688", "Active"],
      ["0345-1188220", "Telenor", "internet", "Unassigned", "Available"],
      ["0311-9022110", "Zong", "zonginternet", "865742091234611", "Issue"],
    ],
    workflows: [
      "Create SIM inventory with provider, APN, password, and activation date.",
      "Link SIM to installed device and customer vehicle.",
      "Store device login and server configuration for troubleshooting.",
      "Flag inactive or misconfigured SIM/device combinations.",
    ],
  },
  finance: {
    title: "Finance & Expenses",
    activeHref: "/finance",
    primaryAction: "Record Entry",
    description:
      "Track income, supplier purchases, technician payments, ad spend, courier charges, office expenses, revenue, and profitability.",
    metrics: [
      { label: "Monthly Revenue", value: "$86.4k", detail: "Device + service income" },
      { label: "Expenses", value: "$31.8k", detail: "Purchases and operations" },
      { label: "Net Profit", value: "$47.4k", detail: "+9.4% this month" },
      { label: "Receivables", value: "$12.1k", detail: "Pending invoices" },
    ],
    tableColumns: ["Entry", "Type", "Category", "Amount", "Date"],
    tableRows: [
      ["Metro Fleet invoice", "Income", "Service Charges", "$2,535.50", "Jun 8"],
      ["Supplier batch", "Expense", "Device Purchase", "$9,800.00", "Jun 6"],
      ["Facebook campaign", "Expense", "Advertising", "$680.00", "Jun 5"],
    ],
    workflows: [
      "Record device sales, installation charges, service charges, and insurance revenue.",
      "Record supplier, technician, fuel, ads, courier, and office expenses.",
      "Connect finance entries to customers, jobs, invoices, and commissions.",
      "Generate daily, monthly, yearly, customer-wise, and technician-wise reports.",
    ],
  },
  commissions: {
    title: "Commission System",
    activeHref: "/commissions",
    primaryAction: "Create Rule",
    description:
      "Automate salesperson commission, technician installation payouts, fuel reimbursements, performance bonuses, and monthly salary sheets.",
    metrics: [
      { label: "Pending Payout", value: "$7.2k", detail: "This payroll cycle" },
      { label: "Sales Bonus", value: "$2.1k", detail: "Target-based" },
      { label: "Tech Commission", value: "$3.8k", detail: "Installations" },
      { label: "Fuel Claims", value: "$940", detail: "Awaiting approval" },
    ],
    tableColumns: ["Employee", "Role", "Reason", "Amount", "Status"],
    tableRows: [
      ["Sara Sales", "Sales", "Lead conversion", "$450", "Pending"],
      ["Ali Raza", "Technician", "Installations", "$360", "Approved"],
      ["Hamza Field", "Technician", "Fuel reimbursement", "$90", "Pending"],
    ],
    workflows: [
      "Define commission rules per device type, area, and performance tier.",
      "Attach commission to converted leads and completed work orders.",
      "Calculate monthly salary sheet and pending payments.",
      "Export commission report PDF for finance approval.",
    ],
  },
  whatsapp: {
    title: "WhatsApp Integration",
    activeHref: "/whatsapp",
    primaryAction: "Add Template",
    description:
      "Store WhatsApp conversations, auto-create leads, manage reply templates, and automate installation and customer update messages.",
    metrics: [
      { label: "Chats Logged", value: "1,938", detail: "Lead and customer history" },
      { label: "Auto Leads", value: "126", detail: "From WhatsApp inquiries" },
      { label: "Templates", value: "14", detail: "Price, follow-up, booking" },
      { label: "Failed Sends", value: "03", detail: "Needs retry" },
    ],
    tableColumns: ["Contact", "Type", "Last Message", "Owner", "Status"],
    tableRows: [
      ["0300-1111111", "Lead", "Price inquiry", "Sara Sales", "Open"],
      ["0312-2222222", "Customer", "Technician on the way", "Support", "Sent"],
      ["0321-3333333", "Lead", "Follow-up pending", "Usman Sales", "Due"],
    ],
    workflows: [
      "Connect WhatsApp Cloud API or approved provider.",
      "Auto-create leads from incoming inquiries and store chat history.",
      "Use templates for price inquiry, follow-up, and installation booking.",
      "Send customer updates for scheduled, on-the-way, and completed installs.",
    ],
  },
  support: {
    title: "Support Tickets",
    activeHref: "/support",
    primaryAction: "Open Ticket",
    description:
      "Track customer support issues, warranty claims, device faults, inactive units, and technician follow-up tasks.",
    metrics: [
      { label: "Open Tickets", value: "28", detail: "6 high priority" },
      { label: "Warranty Claims", value: "09", detail: "Replacement review" },
      { label: "Resolved Today", value: "13", detail: "Support team" },
      { label: "SLA Risk", value: "04", detail: "Escalate now" },
    ],
    tableColumns: ["Ticket", "Customer", "Device", "Priority", "Status"],
    tableRows: [
      ["GPS not updating", "Metro Fleet", "865742091234688", "High", "Open"],
      ["SIM offline", "City Cargo", "865742091234611", "Normal", "In Progress"],
      ["Warranty replacement", "Al Noor", "865742091234567", "High", "Open"],
    ],
    workflows: [
      "Create ticket from customer, WhatsApp message, or inactive device alert.",
      "Attach device, SIM, warranty, and installation history.",
      "Assign support agent or technician visit.",
      "Resolve with activity log and customer follow-up.",
    ],
  },
  insurance: {
    title: "Insurance",
    activeHref: "/insurance",
    primaryAction: "Add Policy",
    description:
      "Manage insurance policies, customer renewals, payment tracking, policy expiry alerts, and insurance sales commissions.",
    metrics: [
      { label: "Active Policies", value: "412", detail: "Across customers" },
      { label: "Renewals Due", value: "36", detail: "Next 30 days" },
      { label: "Revenue", value: "$18.7k", detail: "This quarter" },
      { label: "Commission", value: "$1.9k", detail: "Insurance sales" },
    ],
    tableColumns: ["Customer", "Policy", "Start", "End", "Status"],
    tableRows: [
      ["Metro Fleet", "Commercial Fleet", "Jan 1", "Dec 31", "Active"],
      ["City Cargo", "Cargo Cover", "Mar 12", "Mar 11", "Renewal Due"],
      ["Al Noor", "Vehicle Policy", "Jun 1", "May 31", "Active"],
    ],
    workflows: [
      "Create customer insurance policy with start/end dates and payment tracking.",
      "Schedule renewal alerts before policy expiry.",
      "Connect insurance income and salesperson commission.",
      "Send renewal reminders through WhatsApp or call follow-up.",
    ],
  },
  reports: {
    title: "Reports & Analytics",
    activeHref: "/reports",
    primaryAction: "Build Report",
    description:
      "Monitor business performance, device flow, lead conversion, revenue vs expense, team performance, and operational bottlenecks.",
    metrics: [
      { label: "Reports Ready", value: "18", detail: "Reusable dashboards" },
      { label: "Top Conversion", value: "31%", detail: "WhatsApp source" },
      { label: "Install Time", value: "52m", detail: "Average field job" },
      { label: "Profit Margin", value: "54.8%", detail: "Month to date" },
    ],
    tableColumns: ["Report", "Focus", "Owner", "Frequency", "Status"],
    tableRows: [
      ["Sales Funnel", "Leads", "Admin", "Daily", "Ready"],
      ["Device Movement", "Inventory", "Ops", "Weekly", "Ready"],
      ["Expense Breakdown", "Finance", "Accountant", "Monthly", "Draft"],
    ],
    workflows: [
      "Combine operational, finance, lead, customer, and team data.",
      "Track real-time KPIs and historical trends.",
      "Export reports for management and accounting review.",
      "Use insights to flag inactive devices and lead follow-up gaps.",
    ],
  },
  documents: {
    title: "Documents & Invoices",
    activeHref: "/documents",
    primaryAction: "Generate PDF",
    description:
      "Generate branded customer invoices, technician job sheets, purchase receipts, commission reports, and PDF records.",
    metrics: [
      { label: "Invoices", value: "2,418", detail: "Lifetime generated" },
      { label: "Job Sheets", value: "842", detail: "Technician records" },
      { label: "Receipts", value: "391", detail: "Purchases and payments" },
      { label: "Pending PDFs", value: "12", detail: "Awaiting generation" },
    ],
    tableColumns: ["Document", "Customer", "Type", "Amount", "Status"],
    tableRows: [
      ["INV-03124-26", "Metro Fleet", "Invoice", "$2,535.50", "Sent"],
      ["JOB-0420-26", "Al Noor", "Job Sheet", "-", "Ready"],
      ["COM-0601-26", "Ali Raza", "Commission", "$360", "Draft"],
    ],
    workflows: [
      "Generate branded invoice with customer, IMEI, and installation details.",
      "Create technician job sheets with proof and signature fields.",
      "Store generated PDFs in Supabase Storage.",
      "Attach documents to customer, work order, finance, and audit records.",
    ],
  },
  tracking: {
    title: "Live Tracking",
    activeHref: "/tracking",
    primaryAction: "Open Map",
    description:
      "Monitor technician locations, field job movement, inactive device alerts, and GPS-related operational insights.",
    metrics: [
      { label: "Techs Online", value: "12", detail: "Live location enabled" },
      { label: "Vehicles Online", value: "278", detail: "Current active feed" },
      { label: "Inactive Devices", value: "19", detail: "Needs review" },
      { label: "SLA Trips", value: "04", detail: "Running late" },
    ],
    tableColumns: ["Entity", "Location", "Signal", "Last Update", "Status"],
    tableRows: [
      ["Ali Raza", "Gulshan", "Strong", "2 min ago", "On job"],
      ["865742091234688", "Korangi", "Good", "1 min ago", "Active"],
      ["865742091234611", "North Karachi", "Weak", "28 min ago", "Review"],
    ],
    workflows: [
      "Show technician position while assigned jobs are active.",
      "Detect inactive devices from last update timestamps.",
      "Escalate SLA risk when technician or customer visit is delayed.",
      "Feed map and alert data into reports and support tickets.",
    ],
  },
  integrations: {
    title: "Integrations",
    activeHref: "/integrations",
    primaryAction: "Add Source",
    description:
      "Register external apps that will POST data into Supabase, monitor inbound events, and track import/export jobs.",
    metrics: [
      { label: "API Sources", value: "0", detail: "External apps registered" },
      { label: "Inbound Events", value: "0", detail: "Payloads received" },
      { label: "Import Jobs", value: "0", detail: "CSV/XLSX batches" },
      { label: "Export Jobs", value: "0", detail: "Generated files" },
    ],
    tableColumns: ["Source", "Source Key", "Active", "Created At"],
    tableRows: [],
    workflows: [
      "Create one API source per external app or provider.",
      "External app sends POST requests to Supabase REST/RPC using its source key.",
      "Raw payloads are stored in inbound events and processed into ERP tables.",
      "Admins monitor imports, exports, and failed inbound events from this module.",
    ],
  },
  settings: {
    title: "Settings & Controls",
    activeHref: "/settings",
    primaryAction: "Add Rule",
    description:
      "Manage roles, organization settings, automation rules, WhatsApp provider configuration, branches, and audit controls.",
    metrics: [
      { label: "Users", value: "24", detail: "6 pending role assignment" },
      { label: "Roles", value: "05", detail: "Admin, sales, tech, finance, support" },
      { label: "Automations", value: "18", detail: "Follow-up and renewal rules" },
      { label: "Audit Events", value: "9.4k", detail: "Traceable actions" },
    ],
    tableColumns: ["Setting", "Area", "Owner", "Last Updated", "Status"],
    tableRows: [
      ["Role Matrix", "Access Control", "Admin", "Today", "Active"],
      ["WhatsApp Cloud API", "Integration", "Admin", "Jun 8", "Draft"],
      ["Follow-up Rules", "Automation", "Sales", "Jun 7", "Active"],
    ],
    workflows: [
      "Assign user roles and organization/company access.",
      "Configure integrations, follow-up rules, and message templates.",
      "Track audit logs for every important action.",
      "Prepare multi-branch, backup, and restore controls for scaling.",
    ],
  },
} as const;

export type ModuleKey = keyof typeof moduleConfigs;
