import { NextResponse } from "next/server";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    commissionIds?: string[];
    technicianId?: string;
    receiptUrl?: string;
  };

  if (!body.technicianId || !body.commissionIds || !body.commissionIds.length) {
    return NextResponse.json({ error: "Technician and commissions to pay are required." }, { status: 400 });
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

  const { error } = await supabase
    .from("commissions")
    .update({ paid: true, receipt_url: body.receiptUrl || null })
    .eq("technician_id", body.technicianId)
    .in("id", body.commissionIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Fetch the technician name for logging
  const { data: tech } = await supabase
    .from("technicians")
    .select("name")
    .eq("id", body.technicianId)
    .single();

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "updated",
    module_key: "commissions",
    record_id: body.commissionIds[0] ?? body.technicianId,
    record_label: `Marked ${body.commissionIds.length} commission(s) as paid for ${tech?.name || "Technician"}`,
  });

  return NextResponse.json({ ok: true });
}
