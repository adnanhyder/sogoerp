import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
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

  if (moduleKey === "inventory") {
    if (typeof values.technician_id === "string" && values.technician_id) {
      payload.technician_id = values.technician_id;
    }

    if (payload.custody_status === "received_by_technician" && !payload.technician_id) {
      return NextResponse.json(
        { error: "Select which technician received this device." },
        { status: 400 },
      );
    }
  }

  if (moduleKey === "leads" && typeof values.next_follow_up_at === "string" && values.next_follow_up_at) {
    payload.next_follow_up_at = values.next_follow_up_at;
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

  try {
    if (["finance", "commissions"].includes(moduleKey)) {
      requireRole(context, ["admin", "accountant"]);
    } else if (moduleKey === "leads") {
      requireRole(context, ["admin", "sales"]);
    } else {
      requireRole(context, ["admin"]);
    }
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await supabase.from(config.table).update(payload).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "updated",
    module_key: moduleKey,
    record_id: body.id,
    record_label: String(payload.imei ?? payload.name ?? payload.full_name ?? payload.status ?? "Record"),
  });

  return NextResponse.json({ ok: true });
}
