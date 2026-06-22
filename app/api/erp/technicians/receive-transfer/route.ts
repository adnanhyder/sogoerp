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
    const { transferId, receivedAt } = body;

    if (!transferId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Get the transfer to know the device and destination technician
    const { data: transfer, error: fetchError } = await supabase
      .from("device_transfers")
      .select("device_id, to_technician_id")
      .eq("id", transferId)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !transfer) throw fetchError || new Error("Transfer not found.");

    // Update transfer
    const { error: transferError } = await supabase
      .from("device_transfers")
      .update({
        status: "received",
        received_at: receivedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", transferId)
      .eq("organization_id", orgId);

    if (transferError) throw transferError;

    // Update device to new technician
    const { error: deviceError } = await supabase
      .from("devices")
      .update({
        custody_status: "with_technician",
        status: "received_by_technician",
        technician_id: transfer.to_technician_id,
        courier_company: null,
        consignment_number: null,
        updated_at: new Date().toISOString(),
        custody_updated_at: new Date().toISOString()
      })
      .eq("id", transfer.device_id)
      .eq("organization_id", orgId);

    if (deviceError) throw deviceError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
