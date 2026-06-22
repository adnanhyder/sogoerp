import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, requireRole } from "@/lib/erp-context";

import { createClient } from "@/lib/supabase/server";
import { convertLeadToCustomer } from "@/lib/lead-conversion";

function validateConsignment(courier: string, consignment: string) {
  const cleanConsignment = consignment.trim().replace(/[-\s]/g, ""); // strip hyphens or spaces
  const cLower = courier.trim().toLowerCase();

  if (cLower.includes("tcs")) {
    return /^\d{11,12}$/.test(cleanConsignment) 
      ? cleanConsignment 
      : "TCS consignment number must be exactly 11 or 12 digits.";
  }
  if (cLower.includes("leopard")) {
    return /^\d{9,11}$/.test(cleanConsignment)
      ? cleanConsignment
      : "Leopards consignment number must be between 9 and 11 digits.";
  }
  if (cLower.includes("m&p") || cLower.includes("muller") || cLower.includes("phipps")) {
    return /^\d{10,12}$/.test(cleanConsignment)
      ? cleanConsignment
      : "M&P consignment number must be between 10 and 12 digits.";
  }
  if (cLower.includes("trax")) {
    return /^\d{10,14}$/.test(cleanConsignment)
      ? cleanConsignment
      : "Trax consignment number must be between 10 and 14 digits.";
  }
  if (cLower.includes("post") || cLower.includes("pakistan post")) {
    return /^[A-Z]{2}\d{9}PK$/i.test(cleanConsignment)
      ? cleanConsignment.toUpperCase()
      : "Pakistan Post tracking number must be in UPU format (e.g., RG123456789PK).";
  }
  if (cLower.includes("call")) {
    return /^\d{12,13}$/.test(cleanConsignment)
      ? cleanConsignment
      : "Call Courier consignment number must be 12 or 13 digits.";
  }
  if (cLower.includes("blue")) {
    return /^\d{10,12}$/.test(cleanConsignment)
      ? cleanConsignment
      : "BlueEx consignment number must be between 10 and 12 digits.";
  }

  // Default fallback for any other courier
  if (cleanConsignment.length < 5 || cleanConsignment.length > 25 || !/^[A-Z0-9]+$/i.test(cleanConsignment)) {
    return "Consignment number must be alphanumeric and between 5 and 25 characters.";
  }
  return cleanConsignment;
}

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

  // 1. Validation for CNIC
  if ("cnic" in payload && typeof payload.cnic === "string" && payload.cnic !== "") {
    const cleanCnic = payload.cnic.replace(/-/g, "");
    if (cleanCnic.length !== 13 || !/^\d{13}$/.test(cleanCnic)) {
      return NextResponse.json({ error: "Technician CNIC must be a valid 13-digit number (e.g., XXXXX-XXXXXXX-X)." }, { status: 400 });
    }
    payload.cnic = `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(5, 12)}-${cleanCnic.slice(12)}`;
  }
  if ("authorization_person_cnic" in payload && typeof payload.authorization_person_cnic === "string" && payload.authorization_person_cnic !== "") {
    const cleanCnic = payload.authorization_person_cnic.replace(/-/g, "");
    if (cleanCnic.length !== 13 || !/^\d{13}$/.test(cleanCnic)) {
      return NextResponse.json({ error: "Authorization Person CNIC must be a valid 13-digit number (e.g., XXXXX-XXXXXXX-X)." }, { status: 400 });
    }
    payload.authorization_person_cnic = `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(5, 12)}-${cleanCnic.slice(12)}`;
  }

  // 2. Validation for Pakistani Phone Numbers
  const phoneFields = ["phone", "whatsapp", "authorization_person_phone"];
  for (const fieldName of phoneFields) {
    if (fieldName in payload && typeof payload[fieldName] === "string" && payload[fieldName] !== "") {
      const originalValue = payload[fieldName] as string;
      let clean = originalValue.replace(/[^\d+]/g, "");

      if (clean.startsWith("+9203") && clean.length === 14) {
        clean = "+92" + clean.slice(4);
      } else if (clean.startsWith("9203") && clean.length === 13) {
        clean = "+92" + clean.slice(3);
      } else if (clean.startsWith("03") && clean.length === 11) {
        clean = "+92" + clean.slice(1);
      } else if (clean.startsWith("3") && clean.length === 10) {
        clean = "+92" + clean;
      } else if (clean.startsWith("923") && clean.length === 12) {
        clean = "+" + clean;
      }

      if (!/^\+923\d{9}$/.test(clean)) {
        return NextResponse.json({ error: `${fieldName.replace(/_/g, " ").toUpperCase()} must be a valid Pakistani mobile number starting with +92 3xx (11 digits total).` }, { status: 400 });
      }
      payload[fieldName] = clean;
    }
  }

  // 3. Validation for Courier & Consignment (Inventory)
  if (moduleKey === "inventory") {
    // Read courier/consignment directly from values since they bypass the create-config field loop
    const courierFromValues = values.courier_company !== undefined ? String(values.courier_company ?? "").trim() : undefined;
    const consignmentFromValues = values.consignment_number !== undefined ? String(values.consignment_number ?? "").trim() : undefined;

    const supabase = await createClient();
    const { data: existingDevice } = await supabase
      .from("devices")
      .select("courier_company, consignment_number, custody_status")
      .eq("id", body.id)
      .single();

    const incomingCustody = payload.custody_status as string | undefined;
    const isTransit = incomingCustody === "on_the_way" ||
      (existingDevice?.custody_status === "on_the_way" &&
        incomingCustody !== "company_hands" &&
        incomingCustody !== "received_by_technician");

    // Use incoming value if provided, otherwise fall back to what's already in DB
    const courier = courierFromValues !== undefined ? courierFromValues : (existingDevice?.courier_company ?? "");
    const consignment = consignmentFromValues !== undefined ? consignmentFromValues : (existingDevice?.consignment_number ?? "");

    if (isTransit) {
      // When on_the_way, both fields are required
      if (!courier) {
        return NextResponse.json({ error: "Courier Company is required when custody is 'On The Way'." }, { status: 400 });
      }
      if (!consignment) {
        return NextResponse.json({ error: "Consignment Number is required when custody is 'On The Way'." }, { status: 400 });
      }

      const validatedConsignment = validateConsignment(courier, consignment);
      if (validatedConsignment.includes("must") || validatedConsignment.includes("characters")) {
        return NextResponse.json({ error: validatedConsignment }, { status: 400 });
      }
      payload.courier_company = courier;
      payload.consignment_number = validatedConsignment;
    } else {
      // Not on the way — clear courier/consignment if they were explicitly set to empty
      if (courierFromValues !== undefined) payload.courier_company = courier || null;
      if (consignmentFromValues !== undefined) payload.consignment_number = consignment || null;
    }
  }

  // 4. Validation for Courier & Consignment (Leads Device Assignment)
  if (moduleKey === "leads" && (payload.consignment_number || payload.courier_company)) {
    const courier = String(payload.courier_company ?? "");
    const consignment = String(payload.consignment_number ?? "");

    if (!courier) {
      return NextResponse.json({ error: "Courier Company is required if Consignment Number is provided." }, { status: 400 });
    }
    if (!consignment) {
      return NextResponse.json({ error: "Consignment Number is required if Courier Company is provided." }, { status: 400 });
    }

    const validatedConsignment = validateConsignment(courier, consignment);
    if (validatedConsignment.includes("must") || validatedConsignment.includes("characters")) {
      return NextResponse.json({ error: validatedConsignment }, { status: 400 });
    }
    payload.consignment_number = validatedConsignment;
  }

  // 5. IMEI: clean spaces/dots/dashes — no length restriction
  if ("imei" in payload && typeof payload.imei === "string" && payload.imei !== "") {
    payload.imei = payload.imei.replace(/[\s.-]/g, "").trim();
  }

  // 6. Allow sent_by_technician_id for inventory transfers
  if (moduleKey === "inventory" && "sent_by_technician_id" in values) {
    payload.sent_by_technician_id = values.sent_by_technician_id || null;
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
    if (!context.organizationId) throw new Error("No organization context found.");
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

    try {
      await convertLeadToCustomer(supabase, body.id, context as any);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to convert lead to customer." },
        { status: 400 },
      );
    }
  }

  // Remove the shipment tracking details from payload before updating the leads table
  if (moduleKey === "leads") {
    if (payload.assigned_device_custody_status !== undefined) {
      delete payload.assigned_device_custody_status;
    }
    if (payload.consignment_number !== undefined) {
      delete payload.consignment_number;
    }
    if (payload.courier_company !== undefined) {
      delete payload.courier_company;
    }
  }

  let { error } = await supabase.from(config.table).update(payload).eq("id", body.id);

  // If the sent_by_technician_id column doesn't exist yet (migration not run),
  // silently retry without it so the rest of the fields still save correctly.
  if (error && error.message.includes("sent_by_technician_id")) {
    delete payload.sent_by_technician_id;
    const retry = await supabase.from(config.table).update(payload).eq("id", body.id);
    error = retry.error;
  }

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
      await promoteLeadToCustomer(supabase, associatedLead.id, context as any);
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

