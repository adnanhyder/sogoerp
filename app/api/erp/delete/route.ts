import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    moduleKey?: string;
    reason?: string;
    notes?: string;
    status?: "failed" | "deleted";
  };
  const moduleKey = body.moduleKey as CreateModuleKey;
  const config = createConfigs[moduleKey] as CreateConfig | undefined;

  if (!config || !["inventory", "technicians", "customers", "leads"].includes(moduleKey)) {
    return NextResponse.json({ error: "This ERP module cannot be deleted here." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
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
    requireRole(context, ["admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: record, error: lookupError } = await supabase
    .from(config.table)
    .select("*")
    .eq("id", body.id)
    .single();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  if (moduleKey === "customers") {
    // Insert into customer_records_history
    await supabase.from("customer_records_history").insert({
      customer_id: record.id,
      customer_name: record.full_name,
      phone: record.phone,
      location: record.location,
      reason: body.reason || "Not specified",
      notes: body.notes || "",
      deleted_by: context.userId,
      status: body.status || "deleted",
    });

    // Fetch all work orders associated with this customer first
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id")
      .eq("customer_id", body.id);
    
    const workOrderIds = workOrders?.map((w) => w.id) ?? [];

    // Delete finance entries associated with this customer
    await supabase
      .from("finance_entries")
      .delete()
      .eq("related_customer_id", body.id);

    // Delete finance entries and commissions associated with the customer's work orders
    if (workOrderIds.length > 0) {
      await Promise.all([
        supabase.from("finance_entries").delete().in("related_work_order_id", workOrderIds),
        supabase.from("commissions").delete().in("work_order_id", workOrderIds),
      ]);
    }

    // Delete any devices associated with this customer completely
    await supabase
      .from("devices")
      .delete()
      .eq("customer_id", body.id);

    // Delete dependent records
    await Promise.all([
      supabase.from("vehicles").delete().eq("customer_id", body.id),
      supabase.from("work_orders").delete().eq("customer_id", body.id),
      supabase.from("customer_meetings").delete().eq("customer_id", body.id),
      supabase.from("insurance_policies").delete().eq("customer_id", body.id),
    ]);

    // Delete the source lead if exists
    if (record.source_lead_id) {
      await supabase.from("leads").delete().eq("id", record.source_lead_id);
    }
  }

  if (moduleKey === "inventory" && record.status === "installed" && record.customer_id) {
    const customerId = record.customer_id;

    // Fetch the customer first to get the source_lead_id
    const { data: customerRecord } = await supabase
      .from("customers")
      .select("source_lead_id")
      .eq("id", customerId)
      .single();

    // Fetch all work orders associated with this customer first
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id")
      .eq("customer_id", customerId);
    
    const workOrderIds = workOrders?.map((w) => w.id) ?? [];

    // Delete finance entries associated with this customer
    await supabase
      .from("finance_entries")
      .delete()
      .eq("related_customer_id", customerId);

    // Delete finance entries and commissions associated with the customer's work orders
    if (workOrderIds.length > 0) {
      await Promise.all([
        supabase.from("finance_entries").delete().in("related_work_order_id", workOrderIds),
        supabase.from("commissions").delete().in("work_order_id", workOrderIds),
      ]);
    }

    // Delete dependent records for the customer
    await Promise.all([
      supabase.from("vehicles").delete().eq("customer_id", customerId),
      supabase.from("work_orders").delete().eq("customer_id", customerId),
      supabase.from("customer_meetings").delete().eq("customer_id", customerId),
      supabase.from("insurance_policies").delete().eq("customer_id", customerId),
    ]);

    // Delete the customer
    await supabase.from("customers").delete().eq("id", customerId);

    // Delete the source lead if exists
    if (customerRecord?.source_lead_id) {
      await supabase.from("leads").delete().eq("id", customerRecord.source_lead_id);
    }
  }

  const { error } = await supabase.from(config.table).delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "deleted",
    module_key: moduleKey,
    record_id: body.id,
    record_label: String(record.imei ?? record.name ?? "Record"),
  });

  return NextResponse.json({ ok: true });
}
