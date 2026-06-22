import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function POST(request: Request) {
  const supabase = await createClient();

  let orgId: string;
  try {
    const ctx = await getErpUserContext(supabase);
    if (!ctx.organizationId) throw new Error("No organization context found.");
    orgId = ctx.organizationId;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { deviceId, fromTechnicianId, toTechnicianId, courierName, trackingNumber, departedAt } = body;

    if (!deviceId || !fromTechnicianId || !toTechnicianId || !courierName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Insert device_transfers
    const { error: transferError } = await supabase
      .from("device_transfers")
      .insert({
        organization_id: orgId,
        device_id: deviceId,
        from_technician_id: fromTechnicianId,
        to_technician_id: toTechnicianId,
        courier_name: courierName,
        tracking_number: trackingNumber || null,
        departed_at: departedAt || new Date().toISOString(),
        status: "in_transit"
      });

    if (transferError) throw transferError;

    // Update device
    const { error: deviceError } = await supabase
      .from("devices")
      .update({
        custody_status: "in_transit",
        status: "assigned_to_courier",
        courier_company: courierName,
        consignment_number: trackingNumber || null,
        updated_at: new Date().toISOString(),
        custody_updated_at: new Date().toISOString()
      })
      .eq("id", deviceId)
      .eq("organization_id", orgId);

    if (deviceError) throw deviceError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
