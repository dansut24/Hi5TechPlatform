import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const DEFAULT_TRIAL_MODULES = ["itsm", "control", "selfservice", "admin"]

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U"
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
  const { data: existing } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("slug", signup.tenant_slug)
    .maybeSingle()

  if (existing) return existing

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

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

  if (existing) return

  const { error } = await admin
    .from("memberships")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role: "owner",
      status: "active",
    })

  if (error) throw error
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

  if (existing) return

  const { error } = await admin
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
    })

  if (error) throw error
}

async function ensureModuleAssignments(admin, tenantId, userId) {
  const rows = DEFAULT_TRIAL_MODULES.map((moduleKey) => ({
    tenant_id: tenantId,
    user_id: userId,
    module_key: moduleKey,
  }))

  const { error } = await admin
    .from("module_assignments")
    .upsert(rows, {
      onConflict: "tenant_id,user_id,module_key",
    })

  if (error) throw error
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient()
    const admin = getSupabaseAdminClient()
    const body = await request.json()
    const signupId = body.signupId

    if (!signupId) {
      return NextResponse.json({ error: "Missing signup id" }, { status: 400 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: signup, error: signupError } = await admin
      .from("trial_signups")
      .select("*")
      .eq("id", signupId)
      .maybeSingle()

    if (signupError) throw signupError
    if (!signup) {
      return NextResponse.json({ error: "Signup not found" }, { status: 404 })
    }

    if (signup.created_user_id && signup.created_user_id !== user.id) {
      return NextResponse.json({ error: "Signup does not belong to this user" }, { status: 403 })
    }

    await ensureProfile(admin, {
      userId: user.id,
      email: signup.superuser_email,
      fullName: signup.full_name,
    })

    const tenant = await ensureTenant(admin, signup, user.id)
    await ensureMembership(admin, tenant.id, user.id)
    const adminGroup = await ensureAdminGroup(admin, tenant.id)
    await ensureGroupMember(admin, adminGroup.id, user.id)
    await ensureModuleAssignments(admin, tenant.id, user.id)

    const { error: updateError } = await admin
      .from("trial_signups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        created_tenant_id: tenant.id,
        created_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signup.id)

    if (updateError) throw updateError

    return NextResponse.json({
      ok: true,
      tenant: {
        slug: tenant.slug,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to finalize setup" },
      { status: 500 }
    )
  }
}
