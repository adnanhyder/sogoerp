import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ActivityEvent = {
  created_at: string;
  event_type: "created" | "deleted" | "updated";
  id: string;
  module_key: string;
  record_label: string;
};

type NotificationEvent = Omit<ActivityEvent, "event_type"> & {
  event_type: ActivityEvent["event_type"] | "hard" | "followup";
  lead_name?: string;
  lead_id?: string;
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

  // Fetch standard activity events
  const { data, error } = await supabase
    .from("activity_events")
    .select("id,event_type,module_key,record_label,created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let events: NotificationEvent[] = (data ?? []) as ActivityEvent[];

  // Fetch upcoming meetings
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: meetings, error: meetingsError } = await supabase
    .from("customer_meetings")
    .select("id,scheduled_at,status,customers(full_name),technicians(name)")
    .lte("scheduled_at", soon)
    .in("status", ["scheduled", "rescheduled"])
    .order("scheduled_at", { ascending: true })
    .limit(8);

  if (meetingsError) {
    return NextResponse.json({ error: meetingsError.message }, { status: 400 });
  }

  const meetingEvents: NotificationEvent[] = ((meetings ?? []) as Record<string, unknown>[]).map((meeting) => ({
    created_at: String(meeting.scheduled_at ?? ""),
    event_type: "hard" as const,
    id: String(meeting.id ?? ""),
    module_key: "customers",
    record_label: `Meeting due: ${relatedField(meeting.customers, "full_name") ?? "Customer"} with ${relatedField(meeting.technicians, "name") ?? "technician"}`,
  }));

  // Fetch due unseen follow-ups (within 24 hours)
  const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: followUps, error: followUpsError } = await supabase
    .from("lead_follow_ups")
    .select("id,reason,next_follow_up_at,lead_id,leads(name)")
    .lte("next_follow_up_at", oneDayAhead)
    .eq("seen", false)
    .order("next_follow_up_at", { ascending: true })
    .limit(8);

  if (followUpsError) {
    return NextResponse.json({ error: followUpsError.message }, { status: 400 });
  }

  const followUpEvents: NotificationEvent[] = ((followUps ?? []) as Record<string, unknown>[]).map((fu) => {
    const leadObj = (fu.leads || {}) as Record<string, unknown>;
    const leadName = String(leadObj.name ?? "Lead");
    return {
      created_at: String(fu.next_follow_up_at ?? ""),
      event_type: "followup" as const,
      id: String(fu.id ?? ""),
      module_key: "leads",
      record_label: `Follow-up due: ${leadName} - ${fu.reason}`,
      lead_id: String(fu.lead_id ?? ""),
      lead_name: leadName,
    };
  });

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

  // Merge and sort
  events = [...followUpEvents, ...meetingEvents, ...events]
    .sort((a, b) => {
      const isUrgentA = a.event_type === "hard" || a.event_type === "followup";
      const isUrgentB = b.event_type === "hard" || b.event_type === "followup";

      if (isUrgentA && !isUrgentB) {
        return -1;
      }
      if (isUrgentB && !isUrgentA) {
        return 1;
      }

      return Date.parse(b.created_at) - Date.parse(a.created_at);
    })
    .slice(0, 12);

  const { count: unseenCount } = await supabase
    .from("lead_follow_ups")
    .select("id", { count: "exact", head: true })
    .lte("next_follow_up_at", oneDayAhead)
    .eq("seen", false);

  return NextResponse.json({
    notifications: events.map((event) => {
      let message = `${moduleLabel(event.module_key)} ${event.event_type}: ${event.record_label}`;
      let href = moduleHrefs[event.module_key] ?? "/dashboard";

      if (event.event_type === "followup") {
        message = event.record_label;
        const leadName = event.lead_name ?? "";
        const leadId = event.lead_id ?? "";
        href = `/leads?q=${encodeURIComponent(leadName)}&openFollowUps=${leadId}`;
      } else if (event.event_type === "hard") {
        message = event.record_label;
      }

      return {
        href,
        id: event.id,
        message,
        time: formatTime(event.created_at),
        rawTime: event.created_at,
        tone: event.event_type,
      };
    }),
    unseenCount: unseenCount ?? 0,
  });
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
