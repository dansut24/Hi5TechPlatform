import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const ALL_MODULES = ["itsm", "control", "selfservice", "admin", "analytics", "automation"]

export async function getTenantModuleAccess(slug) {
  const supabase = await createSupabaseServerClient()
  const admin = getSupabaseAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) {
    return {
      user: null,
      tenant: null,
      allowedModuleIds: [],
      role: null,
    }
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id, name, slug, plan, status, trial_ends_at, logo_url, brand_hex, brand_dark_hex, login_heading, login_message")
    .eq("slug", slug)
    .maybeSingle()

  if (tenantError) throw tenantError
  if (!tenant) {
    return {
      user,
      tenant: null,
      allowedModuleIds: [],
      role: null,
    }
  }

  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership) {
    return {
      user,
      tenant,
      allowedModuleIds: [],
      role: null,
    }
  }

  const role = membership.role || null

  if (role === "owner") {
    return {
      user,
      tenant,
      allowedModuleIds: ALL_MODULES,
      role,
    }
  }

  const { data: directAssignments, error: directError } = await admin
    .from("module_assignments")
    .select("module_key")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (directError) throw directError

  const { data: groupMemberships, error: groupMembershipsError } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)

  if (groupMembershipsError) throw groupMembershipsError

  const groupIds = (groupMemberships || []).map((row) => row.group_id)

  let groupAssignments = []
  if (groupIds.length) {
    const { data, error } = await admin
      .from("group_module_assignments")
      .select("module_key")
      .eq("tenant_id", tenant.id)
      .in("group_id", groupIds)

    if (error) throw error
    groupAssignments = data || []
  }

  const allowedModuleIds = [...new Set([
    ...(directAssignments || []).map((row) => row.module_key),
    ...groupAssignments.map((row) => row.module_key),
  ])].filter(Boolean)

  return {
    user,
    tenant,
    allowedModuleIds,
    role,
  }
}

export async function requireTenantModuleAccess(slug, moduleKey) {
  const access = await getTenantModuleAccess(slug)

  if (!access.user) {
    redirect(`/tenant/${slug}/login?next=/tenant/${slug}/${moduleKey}`)
  }

  if (!access.tenant) {
    redirect("/select-tenant")
  }

  if (!access.allowedModuleIds.includes(moduleKey)) {
    redirect(`/tenant/${slug}/dashboard?denied=${moduleKey}`)
  }

  return access
}
