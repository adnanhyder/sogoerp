import {
  BarChart3,
  Cable,
  Boxes,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Headset,
  Home,
  MapPinned,
  MessageSquareText,
  ReceiptText,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from "lucide-react";

export const erpModules = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    summary: "Business-wide KPIs, service queue, and revenue pulse.",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    summary: "Device lifecycle, IMEI status, suppliers, and stock movement.",
  },
  {
    title: "Leads",
    href: "/leads",
    icon: BriefcaseBusiness,
    summary: "Sales pipeline, follow-ups, WhatsApp history, and conversion aging.",
  },
  {
    title: "Technicians",
    href: "/technicians",
    icon: Wrench,
    summary: "Field workforce, assignments, proof uploads, and performance.",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    summary: "Permanent customer, vehicle, device, payment, and support records.",
  },
  {
    title: "SIM Config",
    href: "/sim-config",
    icon: Smartphone,
    summary: "SIMs, APN settings, passwords, server credentials, and activations.",
  },
  {
    title: "Finance",
    href: "/finance",
    icon: CircleDollarSign,
    summary: "Income, expenses, supplier purchases, ad spend, and profit reports.",
  },
  {
    title: "Commissions",
    href: "/commissions",
    icon: ReceiptText,
    summary: "Sales commissions, technician payouts, fuel reimbursements, and salary sheets.",
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageSquareText,
    summary: "Lead/customer chat logs, templates, automation, and message history.",
  },
  {
    title: "Support",
    href: "/support",
    icon: Headset,
    summary: "Tickets, warranty handling, service reminders, and customer issues.",
  },
  {
    title: "Insurance",
    href: "/insurance",
    icon: ShieldCheck,
    summary: "Policy records, renewal alerts, payments, and insurance commissions.",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    summary: "Sales, installations, device flow, conversion funnel, and team analytics.",
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    summary: "Invoices, job sheets, receipts, commission reports, and PDFs.",
  },
  {
    title: "Tracking",
    href: "/tracking",
    icon: MapPinned,
    summary: "Technician GPS, live fleet status, and inactive device detection.",
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Cable,
    summary: "External apps, Supabase POST sources, inbound events, imports, and exports.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    summary: "Roles, branches, automation rules, integrations, and audit controls.",
  },
];

export const dashboardKpis = [
  { label: "Active Devices", value: "3,920", detail: "278 online now" },
  { label: "Monthly Sales", value: "$86.4k", detail: "+8.2% vs last month" },
  { label: "Pending Installs", value: "42", detail: "16 due today" },
  { label: "Open Tickets", value: "28", detail: "6 high priority" },
];

export const pipelineStages = [
  { label: "New Lead", count: 84 },
  { label: "Contacted", count: 51 },
  { label: "Negotiation", count: 24 },
  { label: "Scheduled", count: 18 },
  { label: "Installed", count: 12 },
];

export const moduleSnapshots = [
  {
    title: "Device Lifecycle",
    rows: [
      ["Purchased", "186"],
      ["IMEI Approved", "142"],
      ["With Technician", "38"],
      ["Installed", "3,920"],
    ],
  },
  {
    title: "Field Operations",
    rows: [
      ["Assigned Today", "26"],
      ["Completed Today", "11"],
      ["Awaiting Proof", "08"],
      ["SLA Risk", "04"],
    ],
  },
  {
    title: "Finance Pulse",
    rows: [
      ["Revenue", "$86.4k"],
      ["Expenses", "$31.8k"],
      ["Commissions", "$7.2k"],
      ["Net Profit", "$47.4k"],
    ],
  },
];
