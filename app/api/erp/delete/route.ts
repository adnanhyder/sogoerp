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

  if (!config || !["inventory", "technicians", "customers", "leads", "customer_records_history"].includes(moduleKey)) {
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

  if (moduleKey === "leads") {
    // Delete any lead follow-ups
    await supabase.from("lead_follow_ups").delete().eq("lead_id", body.id);
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
        supabase.from("activity_events").delete().in("record_id", workOrderIds), // Clear work order notifications!
      ]);
    }

    // Reset devices associated with this customer instead of deleting them completely
    const { data: customerDevices } = await supabase
      .from("devices")
      .select("id, technician_id")
      .eq("customer_id", body.id);

    if (customerDevices && customerDevices.length > 0) {
      await Promise.all(
        customerDevices.map((device) => {
          const custodyStatus = device.technician_id ? "received_by_technician" : "company_hands";
          return supabase
            .from("devices")
            .update({
              custody_status: custodyStatus,
              status: "approved",
              customer_id: null,
              vehicle_id: null,
              installation_date: null,
              sale_price: null,
            })
            .eq("id", device.id);
        })
      );
    }

    // Fetch meeting IDs and vehicle IDs for notifications cleanup
    const [meetingsRes, vehiclesRes] = await Promise.all([
      supabase.from("customer_meetings").select("id").eq("customer_id", body.id),
      supabase.from("vehicles").select("id").eq("customer_id", body.id),
    ]);
    const meetingIds = meetingsRes.data?.map((m) => m.id) ?? [];
    const vehicleIds = vehiclesRes.data?.map((v) => v.id) ?? [];

    if (meetingIds.length > 0) {
      await supabase.from("activity_events").delete().in("record_id", meetingIds);
    }
    if (vehicleIds.length > 0) {
      await supabase.from("activity_events").delete().in("record_id", vehicleIds);
    }

    // Delete dependent records
    await Promise.all([
      supabase.from("vehicles").delete().eq("customer_id", body.id),
      supabase.from("work_orders").delete().eq("customer_id", body.id),
      supabase.from("customer_meetings").delete().eq("customer_id", body.id),
      supabase.from("insurance_policies").delete().eq("customer_id", body.id),
    ]);

    // Delete the source lead if exists
    if (record.source_lead_id) {
      await Promise.all([
        supabase.from("lead_follow_ups").delete().eq("lead_id", record.source_lead_id),
        supabase.from("activity_events").delete().eq("record_id", record.source_lead_id),
        supabase.from("leads").delete().eq("id", record.source_lead_id)
      ]);
    }
  }

  if (moduleKey === "customer_records_history") {
    const customerId = record.customer_id;
    if (customerId) {
      // Fetch the customer first to get the source_lead_id
      const { data: customerRecord } = await supabase
        .from("customers")
        .select("source_lead_id")
        .eq("id", customerId)
        .maybeSingle();

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
          supabase.from("activity_events").delete().in("record_id", workOrderIds), // Clear work order notifications!
        ]);
      }

      // Reset devices associated with this customer instead of deleting them completely
      const { data: customerDevices } = await supabase
        .from("devices")
        .select("id, technician_id")
        .eq("customer_id", customerId);

      if (customerDevices && customerDevices.length > 0) {
        await Promise.all(
          customerDevices.map((device) => {
            const custodyStatus = device.technician_id ? "received_by_technician" : "company_hands";
            return supabase
              .from("devices")
              .update({
                custody_status: custodyStatus,
                status: "approved",
                customer_id: null,
                vehicle_id: null,
                installation_date: null,
                sale_price: null,
              })
              .eq("id", device.id);
          })
        );
      }

      // Fetch meeting IDs and vehicle IDs for notifications cleanup
      const [meetingsRes, vehiclesRes] = await Promise.all([
        supabase.from("customer_meetings").select("id").eq("customer_id", customerId),
        supabase.from("vehicles").select("id").eq("customer_id", customerId),
      ]);
      const meetingIds = meetingsRes.data?.map((m) => m.id) ?? [];
      const vehicleIds = vehiclesRes.data?.map((v) => v.id) ?? [];

      if (meetingIds.length > 0) {
        await supabase.from("activity_events").delete().in("record_id", meetingIds);
      }
      if (vehicleIds.length > 0) {
        await supabase.from("activity_events").delete().in("record_id", vehicleIds);
      }

      // Delete dependent records
      await Promise.all([
        supabase.from("vehicles").delete().eq("customer_id", customerId),
        supabase.from("work_orders").delete().eq("customer_id", customerId),
        supabase.from("customer_meetings").delete().eq("customer_id", customerId),
        supabase.from("insurance_policies").delete().eq("customer_id", customerId),
      ]);

      // Delete the customer
      await supabase.from("customers").delete().eq("id", customerId);

      // Delete customer's own notifications/events
      await supabase.from("activity_events").delete().eq("record_id", customerId);

      // Delete the source lead if exists
      if (customerRecord?.source_lead_id) {
        await Promise.all([
          supabase.from("lead_follow_ups").delete().eq("lead_id", customerRecord.source_lead_id),
          supabase.from("activity_events").delete().eq("record_id", customerRecord.source_lead_id),
          supabase.from("leads").delete().eq("id", customerRecord.source_lead_id)
        ]);
      }
    }
  }

  if (moduleKey === "technicians") {
    // Clear references in leads and work orders
    await Promise.all([
      supabase.from("leads").update({ assigned_technician_id: null }).eq("assigned_technician_id", body.id),
      supabase.from("work_orders").update({ technician_id: null }).eq("technician_id", body.id),
    ]);

    await Promise.all([
      supabase.from("commissions").delete().eq("technician_id", body.id),
      supabase.from("device_transfers").delete().eq("from_technician_id", body.id),
      supabase.from("device_transfers").delete().eq("to_technician_id", body.id),
      supabase.from("devices").update({ custody_status: "company_hands", technician_id: null, sent_by_technician_id: null }).eq("technician_id", body.id)
    ]);
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
        supabase.from("activity_events").delete().in("record_id", workOrderIds), // Clear work order notifications!
      ]);
    }

    // Fetch meeting IDs and vehicle IDs for notifications cleanup
    const [meetingsRes, vehiclesRes] = await Promise.all([
      supabase.from("customer_meetings").select("id").eq("customer_id", customerId),
      supabase.from("vehicles").select("id").eq("customer_id", customerId),
    ]);
    const meetingIds = meetingsRes.data?.map((m) => m.id) ?? [];
    const vehicleIds = vehiclesRes.data?.map((v) => v.id) ?? [];

    if (meetingIds.length > 0) {
      await supabase.from("activity_events").delete().in("record_id", meetingIds);
    }
    if (vehicleIds.length > 0) {
      await supabase.from("activity_events").delete().in("record_id", vehicleIds);
    }

    // Reset other devices associated with this customer instead of deleting them completely
    const { data: customerDevices } = await supabase
      .from("devices")
      .select("id, technician_id")
      .eq("customer_id", customerId);

    if (customerDevices && customerDevices.length > 0) {
      await Promise.all(
        customerDevices.map((device) => {
          if (device.id === body.id) return Promise.resolve();
          const custodyStatus = device.technician_id ? "received_by_technician" : "company_hands";
          return supabase
            .from("devices")
            .update({
              custody_status: custodyStatus,
              status: "approved",
              customer_id: null,
              vehicle_id: null,
              installation_date: null,
              sale_price: null,
            })
            .eq("id", device.id);
        })
      );
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

    // Delete customer's own notifications/events
    await supabase.from("activity_events").delete().eq("record_id", customerId);

    // Delete the source lead if exists
    if (customerRecord?.source_lead_id) {
      await Promise.all([
        supabase.from("lead_follow_ups").delete().eq("lead_id", customerRecord.source_lead_id),
        supabase.from("activity_events").delete().eq("record_id", customerRecord.source_lead_id),
        supabase.from("leads").delete().eq("id", customerRecord.source_lead_id)
      ]);
    }
  }

  if (moduleKey === "inventory") {
    await Promise.all([
      supabase.from("device_transfers").delete().eq("device_id", body.id),
      supabase.from("leads").update({ assigned_device_id: null }).eq("assigned_device_id", body.id),
      supabase.from("work_orders").update({ device_id: null }).eq("device_id", body.id),
    ]);
  }

  const { error } = await supabase.from(config.table).delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Delete all activity events (notifications) tied to this record
  await supabase.from("activity_events").delete().eq("record_id", body.id);

  return NextResponse.json({ ok: true });
}
