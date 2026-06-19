import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get("technicianId");

  if (!technicianId) {
    return NextResponse.json({ error: "technicianId is required." }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    await getErpUserContext(supabase);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication required." },
      { status: 401 },
    );
  }

  // Fetch all devices assigned to this technician
  const { data: devices, error: devicesError } = await supabase
    .from("devices")
    .select("id,imei,status,custody_status,courier_company,consignment_number,customer_id,customers(full_name,phone,location),created_at")
    .eq("technician_id", technicianId)
    .order("created_at", { ascending: false });

  if (devicesError) {
    return NextResponse.json({ error: devicesError.message }, { status: 400 });
  }

  // Fetch all leads assigned to this technician
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id,name,phone,stage,location,vehicle_type,budget,assigned_device_id,devices(imei,custody_status,consignment_number,courier_company)")
    .eq("assigned_technician_id", technicianId)
    .order("created_at", { ascending: false });

  if (leadsError) {
    return NextResponse.json({ error: leadsError.message }, { status: 400 });
  }

  return NextResponse.json({
    devices: (devices ?? []).map((d) => {
      const customer = d.customers as unknown as Record<string, unknown> | null;
      return {
        id: d.id,
        imei: d.imei,
        status: d.status,
        custodyStatus: d.custody_status,
        courierCompany: d.courier_company ?? "",
        consignmentNumber: d.consignment_number ?? "",
        customerName: customer ? String(customer.full_name ?? "-") : "-",
        customerPhone: customer ? String(customer.phone ?? "-") : "-",
        customerLocation: customer ? String(customer.location ?? "-") : "-",
      };
    }),
    leads: (leads ?? []).map((l) => {
      const device = l.devices as unknown as Record<string, unknown> | null;
      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        stage: l.stage,
        location: l.location,
        vehicleType: l.vehicle_type,
        budget: l.budget,
        deviceImei: device ? String(device.imei ?? "") : "",
        deviceCustody: device ? String(device.custody_status ?? "") : "",
        deviceCourier: device ? String(device.courier_company ?? "") : "",
        deviceConsignment: device ? String(device.consignment_number ?? "") : "",
      };
    }),
  });
}
