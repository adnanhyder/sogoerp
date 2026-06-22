import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getErpUserContext } from "@/lib/erp-context";

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const ctx = await getErpUserContext(supabase);
    const { data, error } = await supabase
      .from("technicians")
      .select("id, name, cities")
      .eq("organization_id", ctx.organizationId)
      .eq("active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json({ technicians: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication required." },
      { status: 401 },
    );
  }
}
