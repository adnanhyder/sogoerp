import { NextResponse } from "next/server";
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
    deviceId?: string;
    salePrice?: string;
    technicianId?: string;
  };

  if (!body.deviceId) {
    return NextResponse.json({ error: "Device is required." }, { status: 400 });
  }

  if (!body.technicianId) {
    return NextResponse.json({ error: "Technician is required." }, { status: 400 });
  }

  const completedAt = completedTimestamp(body.completedAt);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id,imei")
    .eq("id", body.deviceId)
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
    .single();

  if (technicianError || !technician) {
    return NextResponse.json(
      { error: technicianError?.message ?? "Technician was not found." },
      { status: 400 },
    );
  }

  const { data: workOrder, error: workOrderError } = await supabase
    .from("work_orders")
    .insert({
      activation_confirmed: true,
      completed_at: completedAt,
      created_at: completedAt,
      device_id: body.deviceId,
      scheduled_at: completedAt,
      status: "completed",
      technician_id: body.technicianId,
    })
    .select("id")
    .single();

  if (workOrderError) {
    return NextResponse.json({ error: workOrderError.message }, { status: 400 });
  }

  const salePrice = numberOrZero(body.salePrice);
  const commissionAmount =
    body.commissionAmount === "" || body.commissionAmount === undefined
      ? numberOrZero(technician.commission_rate)
      : numberOrZero(body.commissionAmount);

  const { error: deviceUpdateError } = await supabase
    .from("devices")
    .update({
      custody_status: "received_by_technician",
      installation_date: completedAt.slice(0, 10),
      sale_price: salePrice,
      status: "installed",
      technician_id: body.technicianId,
    })
    .eq("id", body.deviceId);

  if (deviceUpdateError) {
    return NextResponse.json({ error: deviceUpdateError.message }, { status: 400 });
  }

  if (commissionAmount > 0) {
    const { error: commissionError } = await supabase.from("commissions").insert({
      amount: commissionAmount,
      created_at: completedAt,
      paid: false,
      reason: `Installation commission for ${device.imei ?? "device"}`,
      technician_id: body.technicianId,
      work_order_id: workOrder.id,
    });

    if (commissionError) {
      return NextResponse.json({ error: commissionError.message }, { status: 400 });
    }
  }

  await supabase.from("activity_events").insert({
    created_by: user.id,
    event_type: "created",
    module_key: "inventory",
    record_id: body.deviceId,
    record_label: `Installed ${device.imei ?? "device"} by ${technician.name ?? "technician"}`,
  });

  return NextResponse.json({ ok: true });
}
