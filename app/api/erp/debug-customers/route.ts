import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(5);
  const { data: leads } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5);
  return NextResponse.json({ customers: data, error, leads });
}
