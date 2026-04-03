import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const DEFAULT_TRIAL_MODULES = ["itsm", "control", "selfservice", "admin"]

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U"
}

async function ensureProfile(admin, { userId, email, fullName }) {
  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        initials: initialsFromName(fullName, email),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (error) throw error
}

async function ensureTenant(admin, signup, authUserId) {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: existingById } = signup.created_tenant_id
    ? await admin
        .from("tenants")
        .select("id, slug")
        .eq("id", signup.created_tenant_id)
        .maybeSingle()
    : { data: null }

  if (existingById) return existingById

  const { data: existingBySlug } = await admin
    .from("tenants")
    .select("id, slug, created_by")
    .eq("slug", signup.tenant_slug)
    .maybeSingle()

  if (existingBySlug) {
    if (!existingBySlug.created_by) {
      await admin
        .from("tenants")
        .update({
          created_by: authUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBySlug.id)
    }
    return existingBySlug
  }

  const { data: tenant, error } = await admin
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

  if (error) throw error
  return tenant
}

async function ensureMembership(admin, tenantId, userId) {
  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await admin
    .from("memberships")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role: "owner",
      status: "active",
    })
    .select("id")
    .single()

  if (error) throw error
  return data
}

async function ensureAdminGroup(admin, tenantId) {
  const { data: existing } = await admin
    .from("groups")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", "Workspace Admins")
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await admin
    .from("groups")
    .insert({
      tenant_id: tenantId,
      name: "Workspace Admins",
      description: "Default administrative group",
    })
    .select("id")
    .single()

  if (error) throw error
  return data
}

async function ensureGroupMember(admin, groupId, userId) {
  const { data: existing } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await admin
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
    })
    .select("id")
    .single()

  if (error) throw error
  return data
}

async function ensureModuleAssignments(admin, tenantId, userId) {
  const moduleRows = DEFAULT_TRIAL_MODULES.map((moduleKey) => ({
    tenant_id: tenantId,
    user_id: userId,
    module_key: moduleKey,
  }))

  const { error } = await admin
    .from("module_assignments")
    .upsert(moduleRows, {
      onConflict: "tenant_id,user_id,module_key",
    })

  if (error) throw error
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

    await ensureProfile(admin, {
      userId: authUserId,
      email: signup.superuser_email,
      fullName: signup.full_name,
    })

    const tenant = await ensureTenant(admin, signup, authUserId)

    await ensureMembership(admin, tenant.id, authUserId)

    const adminGroup = await ensureAdminGroup(admin, tenant.id)
    await ensureGroupMember(admin, adminGroup.id, authUserId)

    await ensureModuleAssignments(admin, tenant.id, authUserId)

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
