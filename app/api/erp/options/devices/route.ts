import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeId = searchParams.get("includeId");

  // If a specific device ID is requested (e.g. an already-installed pre-assigned device)
  if (includeId) {
    const { data, error } = await supabase
      .from("devices")
      .select("id,imei,status,custody_status,technician_id,technicians(name)")
      .eq("id", includeId)
      .single();

    if (error || !data) {
      return NextResponse.json({ device: null });
    }

    return NextResponse.json({
      device: {
        custody_status: (data as any).custody_status,
        id: (data as any).id,
        imei: (data as any).imei,
        status: (data as any).status,
        technicianName: (data as any).technicians?.name || "",
        technician_id: (data as any).technician_id,
      },
    });
  }

  // Fetch devices that are not yet installed/given to customers
  const { data, error } = await supabase
    .from("devices")
    .select("id,imei,status,custody_status,technician_id,technicians(name)")
    .neq("custody_status", "customer_hands")
    .neq("status", "installed")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    devices: data.map((device: any) => ({
      custody_status: device.custody_status,
      id: device.id,
      imei: device.imei,
      status: device.status,
      technicianName: device.technicians?.name || "",
      technician_id: device.technician_id,
    })),
  });
}
