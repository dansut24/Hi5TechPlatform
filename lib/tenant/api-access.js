import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const ALL_MODULES = ["itsm", "control", "selfservice", "admin", "analytics", "automation"]

export async function getTenantApiAccess(slug) {
  const supabase = await createSupabaseServerClient()
  const admin = getSupabaseAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated",
    }
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id, name, slug, plan, status")
    .eq("slug", slug)
    .maybeSingle()

  if (tenantError) throw tenantError
  if (!tenant) {
    return {
      ok: false,
      status: 404,
      error: "Tenant not found",
    }
  }

  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("id, role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership) {
    return {
      ok: false,
      status: 403,
      error: "No tenant membership",
    }
  }

  const role = membership.role || null

  if (role === "owner") {
    return {
      ok: true,
      user,
      tenant,
      membership,
      role,
      allowedModuleIds: ALL_MODULES,
      admin,
      supabase,
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
    ok: true,
    user,
    tenant,
    membership,
    role,
    allowedModuleIds,
    admin,
    supabase,
  }
}

export async function requireTenantApiAccess(slug, moduleKey, options = {}) {
  const access = await getTenantApiAccess(slug)

  if (!access.ok) return access

  if (moduleKey && !access.allowedModuleIds.includes(moduleKey)) {
    return {
      ok: false,
      status: 403,
      error: `Missing ${moduleKey} module access`,
    }
  }

  if (options.adminOnly && !["owner", "admin"].includes(access.role)) {
    return {
      ok: false,
      status: 403,
      error: "Admin access required",
    }
  }

  return access
}
