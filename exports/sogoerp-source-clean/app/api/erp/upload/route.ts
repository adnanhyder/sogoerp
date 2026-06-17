import { NextResponse } from "next/server";
import { getErpUserContext, requireRole } from "@/lib/erp-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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
    requireRole(context, ["admin", "sales"]);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Create a unique filename
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileExtension = file.name.split(".").pop();
  const fileName = `${context.organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from("lead-screenshots")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("lead-screenshots").getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
