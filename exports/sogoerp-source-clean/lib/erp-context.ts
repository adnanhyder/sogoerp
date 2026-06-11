import type { SupabaseClient } from "@supabase/supabase-js";

export type ErpUserContext = {
  organizationId: string | null;
  role: string;
  userId: string;
};

export async function getErpUserContext(supabase: SupabaseClient): Promise<ErpUserContext> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required.");
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,organization_id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  let profile = existingProfile;

  if (!profile) {
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({
        name:
          typeof user.user_metadata?.organization_name === "string" && user.user_metadata.organization_name
            ? user.user_metadata.organization_name
            : "SogoERP",
      })
      .select("id")
      .single();

    if (organizationError) {
      throw organizationError;
    }

    const { data: createdProfile, error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        active: true,
        full_name:
          typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
            ? user.user_metadata.full_name
            : user.email,
        id: user.id,
        organization_id: organization.id,
        role: "admin",
      })
      .select("full_name,organization_id,role")
      .single();

    if (upsertError) {
      throw upsertError;
    }

    profile = createdProfile;
  }

  let organizationId = (profile?.organization_id as string | null | undefined) ?? null;

  if (!organizationId) {
    const organizationName =
      typeof user.user_metadata?.organization_name === "string" && user.user_metadata.organization_name
        ? user.user_metadata.organization_name
        : "SogoERP";
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({ name: organizationName })
      .select("id")
      .single();

    if (organizationError) {
      throw organizationError;
    }

    organizationId = organization.id;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ organization_id: organizationId })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }
  }

  return {
    organizationId,
    role: String(profile?.role ?? "pending_user"),
    userId: user.id,
  };
}

export function organizationPayload(context: ErpUserContext) {
  return context.organizationId ? { organization_id: context.organizationId } : {};
}
