import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    moduleKey?: string;
    values?: Record<string, unknown>;
  };
  const moduleKey = body.moduleKey as CreateModuleKey;
  const config = createConfigs[moduleKey] as CreateConfig | undefined;

  if (!config) {
    return NextResponse.json({ error: "Unsupported ERP module." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const values = body.values ?? {};
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const value = values[field.name];

    if (value === "" || value === undefined) {
      continue;
    }

    if (field.type === "number") {
      payload[field.name] = Number(value);
      continue;
    }

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(value);
      continue;
    }

    payload[field.name] = value;
  }

  if (moduleKey === "technicians") {
    if (typeof values.active === "boolean") {
      payload.active = values.active;
    }

    if (typeof values.disputed === "boolean") {
      payload.disputed = values.disputed;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from(config.table).update(payload).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (user) {
    await supabase.from("activity_events").insert({
      created_by: user.id,
      event_type: "updated",
      module_key: moduleKey,
      record_id: body.id,
      record_label: String(payload.imei ?? payload.name ?? payload.full_name ?? payload.status ?? "Record"),
    });
  }

  return NextResponse.json({ ok: true });
}
