import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function GET() {
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

  const { count, error } = await supabase
    .from("lead_follow_ups")
    .select("id", { count: "exact", head: true })
    .lte("next_follow_up_at", oneDayAhead)
    .eq("seen", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
