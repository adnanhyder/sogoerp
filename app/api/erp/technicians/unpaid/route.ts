import { NextResponse } from "next/server";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get("technicianId");

  if (!technicianId) {
    return NextResponse.json({ error: "Technician ID is required." }, { status: 400 });
  }

  const supabase = await createClient();
  let context;

  try {
    context = await getErpUserContext(supabase);
    requireRole(context, ["admin"]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Forbidden." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("commissions")
    .select("id, amount, reason, created_at")
    .eq("technician_id", technicianId)
    .eq("paid", false)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ unpaid: data });
}
