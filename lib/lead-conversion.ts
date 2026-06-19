import { SupabaseClient } from "@supabase/supabase-js";
import { organizationPayload } from "@/lib/erp-context";

export async function convertLeadToCustomer(
  supabase: SupabaseClient,
  leadId: string,
  context: { organizationId: string; userId: string }
) {
  // First, check if already converted to prevent duplicates
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("source_lead_id", leadId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (existingCustomer) {
    return { ok: true, customerId: existingCustomer.id };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,name,phone,whatsapp,location,vehicle_type,budget")
    .eq("id", leadId)
    .eq("organization_id", context.organizationId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Lead was not found.");
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
    throw new Error(customerError.message);
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
    throw new Error(vehicleError.message);
  }

  const { error: workOrderError } = await supabase.from("work_orders").insert({
    customer_id: customer.id,
    lead_id: lead.id,
    ...organizationPayload(context),
    status: "assigned",
    vehicle_id: vehicle.id,
  });

  if (workOrderError) {
    throw new Error(workOrderError.message);
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      stage: "installation_scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase.from("activity_events").insert([
    {
      created_by: context.userId,
      event_type: "updated",
      module_key: "leads",
      record_id: leadId,
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

  return { ok: true, customerId: customer.id };
}
