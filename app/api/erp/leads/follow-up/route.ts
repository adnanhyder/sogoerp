import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext, organizationPayload, requireRole } from "@/lib/erp-context";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
  }

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

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .select("id,reason,notes,next_follow_up_at,seen,created_at,screenshot_url")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ followUps: data ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    leadId?: string;
    reason?: string;
    notes?: string;
    nextFollowUpAt?: string;
    screenshotUrl?: string;
  };

  const { leadId, reason, notes, nextFollowUpAt, screenshotUrl } = body;

  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }
  if (!nextFollowUpAt) {
    return NextResponse.json({ error: "Next follow-up date and time is required." }, { status: 400 });
  }

  const supabase = await createClient();
  let context;

  try {
    context = await getErpUserContext(supabase);
    requireRole(context, ["admin", "sales"]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Forbidden." },
      { status: 403 },
    );
  }

  // Insert the follow-up note
  const followUpPayload = {
    lead_id: leadId,
    reason,
    notes: notes ?? "",
    next_follow_up_at: nextFollowUpAt,
    screenshot_url: screenshotUrl ?? null,
    seen: false,
    organization_id: context.organizationId,
  } as any;

  const { data: insertedFollowUp, error: insertError } = await supabase
    .from("lead_follow_ups")
    .insert(followUpPayload)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // Update lead's next_follow_up_at
  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({ next_follow_up_at: nextFollowUpAt })
    .eq("id", leadId);

  if (updateLeadError) {
    return NextResponse.json({ error: updateLeadError.message }, { status: 400 });
  }

  // Log activity event
  const { data: leadData } = await supabase
    .from("leads")
    .select("name")
    .eq("id", leadId)
    .single();

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "updated",
    module_key: "leads",
    record_id: leadId,
    record_label: `${leadData?.name ?? "Lead"}: Follow-up logged - ${reason.slice(0, 30)}${reason.length > 30 ? "..." : ""}`,
  });

  return NextResponse.json({ ok: true });
}
