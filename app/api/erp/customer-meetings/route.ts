import { NextResponse } from "next/server";
import { getErpUserContext, organizationPayload, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";
//ok
function scheduleTimestamp(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    conversationNotes?: string;
    customerId?: string;
    outcome?: string;
    scheduledAt?: string;
    status?: string;
    technicianId?: string;
  };

  if (!body.customerId) {
    return NextResponse.json({ error: "Customer is required." }, { status: 400 });
  }

  if (!body.technicianId) {
    return NextResponse.json({ error: "Technician is required." }, { status: 400 });
  }

  const scheduledAt = scheduleTimestamp(body.scheduledAt);

  if (!scheduledAt) {
    return NextResponse.json({ error: "Meeting date and time is required." }, { status: 400 });
  }

  const status = body.status || "scheduled";
  const supabase = await createClient();
  let context;

  try {
    context = await getErpUserContext(supabase);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication required." },
      { status: 401 },
    );
  }

  try {
    requireRole(context, ["admin", "sales", "support"]);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: latestMeeting, error: latestError } = await supabase
    .from("customer_meetings")
    .select("scheduled_at")
    .eq("customer_id", body.customerId)
    .in("status", ["scheduled", "rescheduled"])
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 400 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("full_name")
    .eq("id", body.customerId)
    .maybeSingle();

  const { data: technician } = await supabase
    .from("technicians")
    .select("name")
    .eq("id", body.technicianId)
    .maybeSingle();

  const { data: meeting, error } = await supabase
    .from("customer_meetings")
    .insert({
      conversation_notes: body.conversationNotes || null,
      customer_id: body.customerId,
      outcome: body.outcome || null,
      ...organizationPayload(context),
      previous_scheduled_at: latestMeeting?.scheduled_at ?? null,
      scheduled_at: scheduledAt,
      status,
      technician_id: body.technicianId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: status === "rescheduled" ? "updated" : "created",
    module_key: "customers",
    record_id: body.customerId,
    record_label: `${customer?.full_name ?? "Customer"} meeting with ${technician?.name ?? "technician"}`,
  });

  return NextResponse.json({ ok: true, meetingId: meeting.id });
}
