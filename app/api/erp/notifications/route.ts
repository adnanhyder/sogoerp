import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ActivityEvent = {
  created_at: string;
  event_type: "created" | "deleted" | "updated";
  id: string;
  module_key: string;
  record_label: string;
};

const moduleHrefs: Record<string, string> = {
  customers: "/customers",
  inventory: "/inventory",
  leads: "/leads",
  support: "/support",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function moduleLabel(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select("id,event_type,module_key,record_label,created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let events = (data ?? []) as ActivityEvent[];

  if (!events.length) {
    const [devices, leads, customers, tickets] = await Promise.all([
      supabase.from("devices").select("id,imei,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("leads").select("id,name,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("customers").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("support_tickets").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
    ]);

    const firstError = [devices.error, leads.error, customers.error, tickets.error].find(Boolean);

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    events = [
      ...(devices.data ?? []).map((record) => ({
        created_at: record.created_at,
        event_type: "created" as const,
        id: record.id,
        module_key: "inventory",
        record_label: record.imei,
      })),
      ...(leads.data ?? []).map((record) => ({
        created_at: record.created_at,
        event_type: "created" as const,
        id: record.id,
        module_key: "leads",
        record_label: record.name,
      })),
      ...(customers.data ?? []).map((record) => ({
        created_at: record.created_at,
        event_type: "created" as const,
        id: record.id,
        module_key: "customers",
        record_label: record.full_name,
      })),
      ...(tickets.data ?? []).map((record) => ({
        created_at: record.created_at,
        event_type: "created" as const,
        id: record.id,
        module_key: "support",
        record_label: record.title,
      })),
    ]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 12);
  }

  return NextResponse.json({
    notifications: events.map((event) => ({
      href: moduleHrefs[event.module_key] ?? "/dashboard",
      id: event.id,
      message: `${moduleLabel(event.module_key)} ${event.event_type}: ${event.record_label}`,
      time: formatTime(event.created_at),
      tone: event.event_type,
    })),
  });
}
