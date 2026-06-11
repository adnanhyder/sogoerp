import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, organizationPayload } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

function recordLabel(values: Record<string, unknown>) {
  const label =
    values.imei ??
    values.name ??
    values.full_name ??
    values.title ??
    values.category ??
    values.reason ??
    values.document_type ??
    values.sim_number ??
    "New record";

  return String(label);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    moduleKey?: string;
    values?: Record<string, unknown>;
  };
  const moduleKey = body.moduleKey as CreateModuleKey;
  const config = createConfigs[moduleKey] as CreateConfig | undefined;

  if (!config) {
    return NextResponse.json({ error: "Unsupported ERP module." }, { status: 400 });
  }

  const values = body.values ?? {};
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const value = values[field.name];

    if (field.required && (value === undefined || value === null || value === "")) {
      return NextResponse.json(
        { error: `${field.label} is required.` },
        { status: 400 },
      );
    }

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

  Object.assign(payload, organizationPayload(context));

  if (moduleKey === "insurance" && typeof payload.customer_id === "string") {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("full_name")
      .eq("id", payload.customer_id)
      .single();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 400 });
    }

    payload.customer_name = customer.full_name;
  }

  const { data, error } = await supabase.from(config.table).insert(payload).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("activity_events").insert({
    created_by: context.userId,
    event_type: "created",
    module_key: moduleKey,
    record_id: data.id,
    record_label: recordLabel(payload),
  });

  return NextResponse.json({ ok: true });
}
