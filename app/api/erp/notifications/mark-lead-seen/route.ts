import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function POST(request: Request) {
  const body = (await request.json()) as { leadId?: string };
  const { leadId } = body;

  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
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

  const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("lead_follow_ups")
    .update({ seen: true })
    .eq("lead_id", leadId)
    .lte("next_follow_up_at", oneDayAhead)
    .eq("seen", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
