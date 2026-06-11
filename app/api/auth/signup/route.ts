import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    fullName?: string;
    organizationName?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const password = body.password ?? "";
  const organizationName = body.organizationName?.trim() || "SogoERP";

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
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
    .insert({ name: organizationName })
    .select("id")
    .single();

  if (organizationError) {
    return NextResponse.json({ error: organizationError.message }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
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
