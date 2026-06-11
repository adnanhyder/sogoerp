import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id,full_name,phone,location,area")
    .order("full_name", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    customers: (data ?? []).map((customer) => ({
      id: customer.id,
      label: `${customer.full_name}${customer.phone ? ` / ${customer.phone}` : ""}${customer.location || customer.area ? ` / ${customer.location ?? customer.area}` : ""}`,
      name: customer.full_name,
    })),
  });
}
