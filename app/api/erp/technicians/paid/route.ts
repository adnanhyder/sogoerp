import { NextResponse } from "next/server";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get("technicianId");

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

  let query = supabase
    .from("commissions")
    .select("id, amount, reason, created_at, receipt_url, technician_id, technicians(name)")
    .eq("paid", true);

  if (technicianId) {
    query = query.eq("technician_id", technicianId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ paid: data });
}
