import { NextResponse } from "next/server";
import { getErpUserContext, organizationPayload, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

function numberOrZero(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function completedTimestamp(value: unknown) {
  if (typeof value !== "string" || !value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    commissionAmount?: string;
    completedAt?: string;
    customerId?: string;
    deviceId?: string;
    salePrice?: string;
    technicianId?: string;
  };

  if (!body.deviceId) {
    return NextResponse.json({ error: "Device is required." }, { status: 400 });
  }

  if (!body.customerId) {
    return NextResponse.json({ error: "Customer is required." }, { status: 400 });
  }

  if (!body.technicianId) {
    return NextResponse.json({ error: "Technician is required." }, { status: 400 });
  }

  const completedAt = completedTimestamp(body.completedAt);
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

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id,imei,customer_id,vehicle_id")
    .eq("id", body.deviceId)
    .eq("organization_id", context.organizationId)
    .single();

  if (deviceError || !device) {
    return NextResponse.json(
      { error: deviceError?.message ?? "Device was not found." },
      { status: 400 },
    );
  }

  const { data: technician, error: technicianError } = await supabase
    .from("technicians")
    .select("id,name,commission_rate")
    .eq("id", body.technicianId)
    .eq("organization_id", context.organizationId)
    .single();

  if (technicianError || !technician) {
    return NextResponse.json(
      { error: technicianError?.message ?? "Technician was not found." },
      { status: 400 },
    );
  }

  // Fetch customer's primary vehicle if they have one and the source lead
  const { data: customer } = await supabase
    .from("customers")
    .select("source_lead_id, full_name, phone, location")
    .eq("id", body.customerId)
    .single();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("customer_id", body.customerId)
    .eq("organization_id", context.organizationId)
    .limit(1)
    .maybeSingle();

  const finalVehicleId = vehicle?.id ?? device.vehicle_id ?? null;

  let workOrder;
  const { data: existingWo } = await supabase
    .from("work_orders")
    .select("id")
    .eq("customer_id", body.customerId)
    .eq("device_id", body.deviceId)
    .in("status", ["assigned", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (existingWo) {
    const { data: updatedWo, error: workOrderError } = await supabase
      .from("work_orders")
      .update({
        activation_confirmed: true,
        completed_at: completedAt,
        status: "completed",
        technician_id: body.technicianId,
        vehicle_id: finalVehicleId,
      })
      .eq("id", existingWo.id)
      .select("id")
      .single();

    if (workOrderError) {
      return NextResponse.json({ error: workOrderError.message }, { status: 400 });
    }
    workOrder = updatedWo;
  } else {
    const { data: newWo, error: workOrderError } = await supabase
      .from("work_orders")
      .insert({
        activation_confirmed: true,
        completed_at: completedAt,
        created_at: completedAt,
        customer_id: body.customerId,
        device_id: body.deviceId,
        ...organizationPayload(context),
        scheduled_at: completedAt,
        status: "completed",
        technician_id: body.technicianId,
        vehicle_id: finalVehicleId,
      })
      .select("id")
      .single();

    if (workOrderError) {
      return NextResponse.json({ error: workOrderError.message }, { status: 400 });
    }
    workOrder = newWo;
  }

  const salePrice = numberOrZero(body.salePrice);
  const commissionAmount =
    body.commissionAmount === "" || body.commissionAmount === undefined
      ? numberOrZero(technician.commission_rate)
      : numberOrZero(body.commissionAmount);

  const { error: deviceUpdateError } = await supabase
    .from("devices")
    .update({
      custody_status: "customer_hands",
      customer_id: body.customerId,
      installation_date: completedAt.slice(0, 10),
      sale_price: salePrice,
      status: "installed",
      technician_id: body.technicianId,
      vehicle_id: finalVehicleId,
    })
    .eq("id", body.deviceId);

  if (deviceUpdateError) {
    return NextResponse.json({ error: deviceUpdateError.message }, { status: 400 });
  }

  if (commissionAmount > 0) {
    const { error: commissionError } = await supabase.from("commissions").insert({
      amount: commissionAmount,
      created_at: completedAt,
      ...organizationPayload(context),
      paid: false,
      reason: `Installation commission for ${device.imei ?? "device"}`,
      technician_id: body.technicianId,
      work_order_id: workOrder.id,
    });

    if (commissionError) {
      return NextResponse.json({ error: commissionError.message }, { status: 400 });
    }
  }

  if (salePrice > 0) {
    const { error: financeError } = await supabase.from("finance_entries").insert({
      amount: salePrice,
      category: "Device Installation",
      created_at: completedAt,
      entry_type: "income",
      occurred_on: completedAt.slice(0, 10),
      ...organizationPayload(context),
      related_customer_id: body.customerId,
      related_work_order_id: workOrder.id,
    });

    if (financeError) {
      return NextResponse.json({ error: financeError.message }, { status: 400 });
    }
  }

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "created",
    module_key: "inventory",
    record_id: body.deviceId,
    record_label: `Installed ${device.imei ?? "device"} by ${technician.name ?? "technician"}`,
  });

  if (customer?.source_lead_id) {
    await supabase.from("leads").update({ stage: "installed" }).eq("id", customer.source_lead_id);
    
    // Dismiss all pending follow-up notifications for this lead
    await supabase
      .from("lead_follow_ups")
      .update({ seen: true })
      .eq("lead_id", customer.source_lead_id)
      .eq("seen", false);

    await supabase.from("activity_events").insert({
      created_by: context.userId,
      event_type: "updated",
      module_key: "leads",
      record_id: customer.source_lead_id,
      record_label: `Marked as won after installation of ${device.imei ?? "device"}`,
    });
  }

  // Update customer status to completed
  await supabase.from("customers").update({ status: "completed" }).eq("id", body.customerId);

  // Insert Success record
  await supabase.from("customer_records_history").insert({
    customer_id: body.customerId,
    customer_name: customer?.full_name || "Unknown",
    phone: customer?.phone || "",
    location: customer?.location || "",
    reason: "Installation Completed",
    notes: `Installed device ${device.imei} by technician ${technician.name}`,
    deleted_by: context.userId,
    status: "success",
  });

  return NextResponse.json({ ok: true });
}
