import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const DEFAULT_TRIAL_MODULES = ["itsm", "control", "selfservice", "admin"]

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U"
}

export async function GET(_request, context) {
  try {
    const admin = getSupabaseAdminClient()
    const { token } = await context.params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const { data: signup, error: signupError } = await admin
      .from("trial_signups")
      .select("*")
      .eq("signup_token", token)
      .maybeSingle()

    if (signupError) throw signupError

    if (!signup) {
      return NextResponse.redirect(new URL("/trial/start", siteUrl))
    }

    if (new Date(signup.token_expires_at).getTime() < Date.now()) {
      await admin
        .from("trial_signups")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", signup.id)

      return NextResponse.redirect(new URL("/trial/start?expired=1", siteUrl))
    }

    if (signup.status === "completed" && signup.tenant_slug) {
      return NextResponse.redirect(new URL(`/tenant/${signup.tenant_slug}/login`, siteUrl))
    }

    const inviteRedirectTo = `${siteUrl}/tenant/${signup.tenant_slug}/set-password`

    const { data: inviteData, error: inviteError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: signup.superuser_email,
      options: {
        redirectTo: inviteRedirectTo,
        data: {
          full_name: signup.full_name,
          tenant_slug: signup.tenant_slug,
          company_name: signup.company_name,
        },
      },
    })

    if (inviteError) throw inviteError

    const authUserId = inviteData?.user?.id
    const actionLink = inviteData?.properties?.action_link

    if (!authUserId || !actionLink) {
      throw new Error("Failed to generate owner invite link")
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: authUserId,
          email: signup.superuser_email,
          full_name: signup.full_name,
          initials: initialsFromName(signup.full_name, signup.superuser_email),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (profileError) throw profileError

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: signup.tenant_name,
        slug: signup.tenant_slug,
        status: "trial",
        plan: "trial",
        created_by: authUserId,
        trial_ends_at: trialEndsAt,
      })
      .select("id, slug")
      .single()

    if (tenantError) throw tenantError

    const { error: membershipError } = await admin
      .from("memberships")
      .insert({
        tenant_id: tenant.id,
        user_id: authUserId,
        role: "owner",
        status: "active",
      })

    if (membershipError) throw membershipError

    const { data: adminGroup, error: groupError } = await admin
      .from("groups")
      .insert({
        tenant_id: tenant.id,
        name: "Workspace Admins",
        description: "Default administrative group",
      })
      .select("id")
      .single()

    if (groupError) throw groupError

    const { error: groupMemberError } = await admin
      .from("group_members")
      .insert({
        group_id: adminGroup.id,
        user_id: authUserId,
      })

    if (groupMemberError) throw groupMemberError

    const moduleRows = DEFAULT_TRIAL_MODULES.map((moduleKey) => ({
      tenant_id: tenant.id,
      user_id: authUserId,
      module_key: moduleKey,
    }))

    const { error: moduleError } = await admin
      .from("module_assignments")
      .upsert(moduleRows, {
        onConflict: "tenant_id,user_id,module_key",
      })

    if (moduleError) throw moduleError

    const { error: signupUpdateError } = await admin
      .from("trial_signups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        created_tenant_id: tenant.id,
        created_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signup.id)

    if (signupUpdateError) throw signupUpdateError

    return NextResponse.redirect(actionLink)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to complete setup" },
      { status: 500 }
    )
  }
}
