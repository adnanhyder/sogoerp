import { NextResponse } from "next/server";
import { getErpUserContext, organizationPayload, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { leadId?: string };

  if (!body.leadId) {
    return NextResponse.json({ error: "Lead is required." }, { status: 400 });
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

  try {
    requireRole(context, ["admin", "sales"]);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,name,phone,whatsapp,location,vehicle_type,budget")
    .eq("id", body.leadId)
    .eq("organization_id", context.organizationId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: leadError?.message ?? "Lead was not found." }, { status: 400 });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      area: lead.location,
      budget: lead.budget,
      full_name: lead.name,
      location: lead.location,
      ...organizationPayload(context),
      phone: lead.phone,
      source_lead_id: lead.id,
      vehicle_type: lead.vehicle_type,
      whatsapp: lead.whatsapp,
    })
    .select("id")
    .single();

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 400 });
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .insert({
      customer_id: customer.id,
      ...organizationPayload(context),
      vehicle_type: lead.vehicle_type,
    })
    .select("id")
    .single();

  if (vehicleError) {
    return NextResponse.json({ error: vehicleError.message }, { status: 400 });
  }

  const { error: workOrderError } = await supabase.from("work_orders").insert({
    customer_id: customer.id,
    lead_id: lead.id,
    ...organizationPayload(context),
    status: "assigned",
    vehicle_id: vehicle.id,
  });

  if (workOrderError) {
    return NextResponse.json({ error: workOrderError.message }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      stage: "installation_scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.leadId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await supabase.from("activity_events").insert([
    {
      created_by: context.userId,
      event_type: "updated",
      module_key: "leads",
      record_id: body.leadId,
      record_label: `Won ${lead.name}`,
    },
    {
      created_by: context.userId,
      event_type: "created",
      module_key: "customers",
      record_id: customer.id,
      record_label: String(lead.name ?? "Customer"),
    },
  ]);

  return NextResponse.json({ ok: true });
}
