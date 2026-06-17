import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string };
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
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

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({ seen: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
