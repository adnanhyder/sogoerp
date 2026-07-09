import { NextResponse } from "next/server";
import { createConfigs, type CreateConfig, type CreateModuleKey } from "@/lib/create-config";
import { getErpUserContext, organizationPayload, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

type DuplicateMode = "replace_existing" | "skip_duplicates";

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

function cleanImei(value: unknown) {
  return typeof value === "string" ? value.replace(/[\s.-]/g, "").trim() : "";
}

function uniqueByImei(payloads: Record<string, unknown>[], mode: DuplicateMode) {
  if (mode === "replace_existing") {
    const byImei = new Map<string, Record<string, unknown>>();
    const withoutImei: Record<string, unknown>[] = [];

    for (const payload of payloads) {
      const imei = cleanImei(payload.imei);

      if (imei) {
        byImei.set(imei, payload);
      } else {
        withoutImei.push(payload);
      }
    }

    return [...withoutImei, ...byImei.values()];
  }

  const seen = new Set<string>();

  return payloads.filter((payload) => {
    const imei = cleanImei(payload.imei);

    if (!imei) {
      return true;
    }

    if (seen.has(imei)) {
      return false;
    }

    seen.add(imei);
    return true;
  });
}

async function removeExistingInventoryDuplicates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string | null,
  duplicateImeis: string[],
) {
  if (!organizationId || !duplicateImeis.length) {
    return;
  }

  const { data: existingDevices, error: lookupError } = await supabase
    .from("devices")
    .select("id")
    .eq("organization_id", organizationId)
    .in("imei", duplicateImeis);

  if (lookupError) {
    throw lookupError;
  }

  const deviceIds = (existingDevices ?? []).map((device) => String(device.id)).filter(Boolean);

  if (!deviceIds.length) {
    return;
  }

  await Promise.all([
    supabase.from("device_transfers").delete().in("device_id", deviceIds),
    supabase.from("leads").update({ assigned_device_id: null }).in("assigned_device_id", deviceIds),
    supabase.from("work_orders").update({ device_id: null }).in("device_id", deviceIds),
  ]);

  const { error: deleteError } = await supabase
    .from("devices")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", deviceIds);

  if (deleteError) {
    throw deleteError;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    duplicateMode?: DuplicateMode;
    moduleKey?: string;
    records?: Array<Record<string, unknown>>;
  };
  const moduleKey = body.moduleKey as CreateModuleKey;
  const config = createConfigs[moduleKey] as CreateConfig | undefined;

  if (!config) {
    return NextResponse.json({ error: "Unsupported ERP module." }, { status: 400 });
  }

  const records = body.records ?? [];
  const payloads: Record<string, unknown>[] = [];

  for (const values of records) {
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

    // 3. Validation for Courier & Consignment
    if (
      ("courier_company" in payload && typeof payload.courier_company === "string" && payload.courier_company !== "") ||
      ("consignment_number" in payload && typeof payload.consignment_number === "string" && payload.consignment_number !== "")
    ) {
      const courier = String(payload.courier_company ?? "");
      const consignment = String(payload.consignment_number ?? "");

      if (courier || consignment) {
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
    }

    // 4. IMEI: clean spaces/dots/dashes — no length restriction
    if ("imei" in payload && typeof payload.imei === "string" && payload.imei !== "") {
      payload.imei = payload.imei.replace(/[\s.-]/g, "").trim();
    }
    
    payloads.push(payload);
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

  for (const payload of payloads) {
    Object.assign(payload, organizationPayload(context));
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

  if (moduleKey === "insurance") {
    // If we have insurance modules, fetch all customer names in bulk (not typically used in bulk but supported here)
    const customerIds = payloads.map(p => typeof p.customer_id === "string" ? p.customer_id : "").filter(Boolean);
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, full_name")
        .in("id", customerIds);
      
      const customerMap = new Map((customers ?? []).map(c => [c.id, c.full_name]));
      for (const payload of payloads) {
        if (typeof payload.customer_id === "string" && customerMap.has(payload.customer_id)) {
          payload.customer_name = customerMap.get(payload.customer_id);
        }
      }
    }
  }

  let finalPayloads = payloads;
  if (moduleKey === "inventory") {
    const csvImeis = payloads.map((payload) => cleanImei(payload.imei)).filter(Boolean);
    const repeatedCsvImeis = csvImeis.filter((imei, index) => csvImeis.indexOf(imei) !== index);
    const { data: existingDevices, error: existingError } = csvImeis.length
      ? await supabase
          .from("devices")
          .select("imei")
          .eq("organization_id", context.organizationId)
          .in("imei", Array.from(new Set(csvImeis)))
      : { data: [], error: null };

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    const existingImeis = (existingDevices ?? []).map((device) => cleanImei(device.imei));
    const duplicateImeis = Array.from(new Set([...existingImeis, ...repeatedCsvImeis])).filter(Boolean);

    if (duplicateImeis.length && !body.duplicateMode) {
      return NextResponse.json(
        {
          duplicateImeis,
          duplicateCount: duplicateImeis.length,
          error: "Duplicate IMEIs found in this CSV import.",
          requiresDuplicateDecision: true,
        },
        { status: 409 },
      );
    }

    if (body.duplicateMode === "replace_existing") {
      try {
        await removeExistingInventoryDuplicates(supabase, context.organizationId, duplicateImeis);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unable to remove existing duplicate IMEIs." },
          { status: 400 },
        );
      }
      finalPayloads = uniqueByImei(payloads, "replace_existing");
    } else if (body.duplicateMode === "skip_duplicates") {
      const existingSet = new Set(existingImeis);
      finalPayloads = uniqueByImei(payloads, "skip_duplicates").filter((payload) => !existingSet.has(cleanImei(payload.imei)));
    }
  }

  if (!finalPayloads.length) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const { data, error } = await supabase.from(config.table).insert(finalPayloads).select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const activityEvents = finalPayloads.map((payload, index) => ({
    created_by: context.userId,
    event_type: "created",
    module_key: moduleKey,
    record_id: data[index].id,
    record_label: recordLabel(payload),
  }));

  await supabase.from("activity_events").insert(activityEvents);

  return NextResponse.json({ ok: true, count: finalPayloads.length });
}
