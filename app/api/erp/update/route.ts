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

    if ("dispute_reason" in values) {
      payload.dispute_reason = values.dispute_reason;
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
    if ("assigned_device_custody_status" in values) {
      payload.assigned_device_custody_status = values.assigned_device_custody_status;
    }
    if ("consignment_number" in values) {
      payload.consignment_number = values.consignment_number;
    }
    if ("courier_company" in values) {
      payload.courier_company = values.courier_company;
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

  if (moduleKey === "leads" && payload.assigned_device_id && payload.assigned_technician_id) {
    const { data: device } = await supabase
      .from("devices")
      .select("technician_id")
      .eq("id", payload.assigned_device_id)
      .single();

    if (device && !device.technician_id) {
      // It's office stock, assign it to the technician as on the way with tracking details!
      const { error: deviceUpdateError } = await supabase
        .from("devices")
        .update({
          technician_id: payload.assigned_technician_id,
          custody_status: "on_the_way",
          consignment_number: payload.consignment_number || null,
          courier_company: payload.courier_company || null,
        })
        .eq("id", payload.assigned_device_id);

      if (deviceUpdateError) {
        return NextResponse.json({ error: deviceUpdateError.message }, { status: 400 });
      }
    }
  }

  // Remove the shipment tracking details from payload before updating the leads table
  if (payload.assigned_device_custody_status !== undefined) {
    delete payload.assigned_device_custody_status;
  }
  if (payload.consignment_number !== undefined) {
    delete payload.consignment_number;
  }
  if (payload.courier_company !== undefined) {
    delete payload.courier_company;
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

  // Run promotion logic if a device custody status becomes received_by_technician
  if (moduleKey === "inventory" && payload.custody_status === "received_by_technician") {
    const { data: associatedLead } = await supabase
      .from("leads")
      .select("id")
      .eq("assigned_device_id", body.id)
      .limit(1)
      .maybeSingle();

    if (associatedLead) {
      await promoteLeadToCustomer(supabase, associatedLead.id, context);
    }
  }

  return NextResponse.json({ ok: true });
}

async function promoteLeadToCustomer(supabase: any, leadId: string, context: any) {
  const { data: lead, error: leadFetchError } = await supabase
    .from("leads")
    .select("id, name, phone, whatsapp, location, vehicle_type, budget, assigned_technician_id, assigned_device_id")
    .eq("id", leadId)
    .single();

  if (leadFetchError || !lead || !lead.assigned_technician_id || !lead.assigned_device_id) {
    return;
  }

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("source_lead_id", lead.id)
    .limit(1)
    .maybeSingle();

  if (!existingCustomer) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        area: lead.location,
        budget: lead.budget,
        full_name: lead.name,
        location: lead.location,
        organization_id: context.organizationId,
        phone: lead.phone,
        source_lead_id: lead.id,
        vehicle_type: lead.vehicle_type,
        whatsapp: lead.whatsapp,
      })
      .select("id")
      .single();

    if (!customerError && newCustomer) {
      const { data: newVehicle } = await supabase
        .from("vehicles")
        .insert({
          customer_id: newCustomer.id,
          organization_id: context.organizationId,
          vehicle_type: lead.vehicle_type,
        })
        .select("id")
        .single();

      await supabase.from("work_orders").insert({
        customer_id: newCustomer.id,
        lead_id: lead.id,
        organization_id: context.organizationId,
        status: "assigned",
        vehicle_id: newVehicle?.id ?? null,
        device_id: lead.assigned_device_id,
        technician_id: lead.assigned_technician_id,
      });

      await supabase.from("devices").update({
        technician_id: lead.assigned_technician_id,
        customer_id: newCustomer.id,
        custody_status: "received_by_technician",
        status: "assigned",
        vehicle_id: newVehicle?.id ?? null,
        consignment_number: null,
        courier_company: null,
      }).eq("id", lead.assigned_device_id);

      await supabase.from("leads").update({
        stage: "installation_scheduled"
      }).eq("id", lead.id);

      await supabase.from("activity_events").insert({
        created_by: context.userId,
        event_type: "created",
        module_key: "customers",
        record_id: newCustomer.id,
        record_label: `Auto-promoted from Lead: ${lead.name}`,
      });
    }
  }
}

