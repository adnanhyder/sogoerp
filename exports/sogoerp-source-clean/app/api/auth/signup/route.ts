import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    fullName?: string;
    organizationName?: string;
    password?: string;
  };

  if (!body.email || !body.password || !body.fullName) {
    return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: {
        full_name: body.fullName,
        organization_name: body.organizationName || "SogoERP",
        role: "admin",
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.session || !data.user) {
    return NextResponse.json(
      {
        error:
          "Account created but Supabase email confirmation is enabled. Confirm email first, then log in.",
      },
      { status: 202 },
    );
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({ name: body.organizationName || "SogoERP" })
    .select("id")
    .single();

  if (organizationError) {
    return NextResponse.json({ error: organizationError.message }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: body.fullName,
      organization_id: organization.id,
      role: "admin",
    })
    .eq("id", data.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
