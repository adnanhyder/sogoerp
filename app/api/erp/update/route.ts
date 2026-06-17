import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, requireRole, organizationPayload } from "@/lib/erp-context";
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

    if ((payload.custody_status === "received_by_technician" || payload.custody_status === "on_the_way") && !payload.technician_id) {
      return NextResponse.json(
        { error: "Select which technician received (or is receiving) this device." },
        { status: 400 },
      );
    }
  }

  if (moduleKey === "leads") {
    if (typeof values.next_follow_up_at === "string" && values.next_follow_up_at) {
      payload.next_follow_up_at = values.next_follow_up_at;
    }
    // Allow clearing or setting assigned technician and device
    if ("assigned_technician_id" in values) {
      payload.assigned_technician_id = values.assigned_technician_id ?? null;
    }
    if ("assigned_device_id" in values) {
      payload.assigned_device_id = values.assigned_device_id ?? null;
    }
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

  // Auto-promotion logic for leads
  if (moduleKey === "leads") {
    const { data: updatedLead, error: leadFetchError } = await supabase
      .from("leads")
      .select("id, name, phone, whatsapp, location, vehicle_type, budget, assigned_technician_id, assigned_device_id")
      .eq("id", body.id)
      .single();

    if (!leadFetchError && updatedLead?.assigned_technician_id && updatedLead?.assigned_device_id) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("source_lead_id", updatedLead.id)
        .limit(1)
        .maybeSingle();

      if (!existingCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            area: updatedLead.location,
            budget: updatedLead.budget,
            full_name: updatedLead.name,
            location: updatedLead.location,
            ...organizationPayload(context),
            phone: updatedLead.phone,
            source_lead_id: updatedLead.id,
            vehicle_type: updatedLead.vehicle_type,
            whatsapp: updatedLead.whatsapp,
          })
          .select("id")
          .single();

        if (!customerError && newCustomer) {
          const { data: newVehicle } = await supabase
            .from("vehicles")
            .insert({
              customer_id: newCustomer.id,
              ...organizationPayload(context),
              vehicle_type: updatedLead.vehicle_type,
            })
            .select("id")
            .single();

          await supabase.from("work_orders").insert({
            customer_id: newCustomer.id,
            lead_id: updatedLead.id,
            ...organizationPayload(context),
            status: "assigned",
            vehicle_id: newVehicle?.id ?? null,
            device_id: updatedLead.assigned_device_id,
            technician_id: updatedLead.assigned_technician_id,
          });

          await supabase.from("devices").update({
            technician_id: updatedLead.assigned_technician_id,
            customer_id: newCustomer.id,
            custody_status: "received_by_technician",
            status: "assigned",
            vehicle_id: newVehicle?.id ?? null,
          }).eq("id", updatedLead.assigned_device_id);

          await supabase.from("leads").update({
            stage: "installation_scheduled"
          }).eq("id", updatedLead.id);

          await supabase.from("activity_events").insert({
            created_by: context.userId,
            event_type: "created",
            module_key: "customers",
            record_id: newCustomer.id,
            record_label: `Auto-promoted from Lead: ${updatedLead.name}`,
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
