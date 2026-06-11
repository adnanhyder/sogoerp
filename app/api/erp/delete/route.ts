import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    moduleKey?: string;
  };
  const moduleKey = body.moduleKey as CreateModuleKey;
  const config = createConfigs[moduleKey] as CreateConfig | undefined;

  if (!config || !["inventory", "technicians"].includes(moduleKey)) {
    return NextResponse.json({ error: "This ERP module cannot be deleted here." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: record, error: lookupError } = await supabase
    .from(config.table)
    .select("*")
    .eq("id", body.id)
    .single();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  const { error } = await supabase.from(config.table).delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (user) {
    await supabase.from("activity_events").insert({
      created_by: user.id,
      event_type: "deleted",
      module_key: moduleKey,
      record_id: body.id,
      record_label: String(record.imei ?? record.name ?? "Record"),
    });
  }

  return NextResponse.json({ ok: true });
}
