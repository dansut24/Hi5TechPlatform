import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { tenantLoginPath, tenantModulePath } from "@/lib/tenant/paths"
import { getUserControlPermissionContext } from "@/lib/permissions/control-server"

function normalizeModuleKey(value) {
  return String(value || "").trim().toLowerCase()
}

async function loadTenantModuleAccess(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      ok: false,
      reason: "unauthorized",
      redirectTo: tenantLoginPath(slug),
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      ok: false,
      reason: "tenant_not_found",
      redirectTo: "/login",
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return {
      ok: false,
      reason: "no_membership",
      redirectTo: tenantLoginPath(slug),
    }
  }

  const isTenantAdmin = ["owner", "admin"].includes(
    String(membership.role || "").toLowerCase()
  )

  const { data: directAssignments, error: directAssignmentsError } = await supabase
    .from("module_assignments")
    .select("module_key")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (directAssignmentsError) {
    throw new Error(
      directAssignmentsError.message || "Failed to load direct module assignments"
    )
  }

  const { data: groupMemberships, error: groupMembershipsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)

  if (groupMembershipsError) {
    throw new Error(
      groupMembershipsError.message || "Failed to load group memberships"
    )
  }

  const groupIds = (groupMemberships || []).map((row) => row.group_id)

  let validGroupIds = []
  if (groupIds.length > 0) {
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("id")
      .eq("tenant_id", tenant.id)
      .in("id", groupIds)

    if (groupsError) {
      throw new Error(groupsError.message || "Failed to validate tenant groups")
    }

    validGroupIds = (groupsData || []).map((row) => row.id)
  }

  let groupAssignments = []
  if (validGroupIds.length > 0) {
    const { data, error } = await supabase
      .from("group_module_assignments")
      .select("group_id, module_key")
      .eq("tenant_id", tenant.id)
      .in("group_id", validGroupIds)

    if (error) {
      throw new Error(error.message || "Failed to load group module assignments")
    }

    groupAssignments = data || []
  }

  const directModuleKeys = (directAssignments || []).map((row) =>
    normalizeModuleKey(row.module_key)
  )

  const inheritedModuleKeys = (groupAssignments || []).map((row) =>
    normalizeModuleKey(row.module_key)
  )

  let allowedModuleIds = Array.from(
    new Set([...directModuleKeys, ...inheritedModuleKeys].filter(Boolean))
  )

  if (isTenantAdmin) {
    allowedModuleIds = Array.from(
      new Set([
        ...allowedModuleIds,
        "itsm",
        "control",
        "selfservice",
        "admin",
        "analytics",
        "automation",
      ])
    )
  }

  const {
    permissionContext: controlPermissionContext,
    effectiveCapabilities,
  } = await getUserControlPermissionContext({
    tenantId: tenant.id,
    userId: user.id,
  })

  const enrichedTenant = {
    ...tenant,
    permissionContext: {
      role: membership.role,
      roles: [membership.role],
      moduleAssignments: allowedModuleIds,
      controlCapabilities: controlPermissionContext.controlCapabilities || [],
      effectiveControlCapabilities: effectiveCapabilities || [],
    },
  }

  return {
    ok: true,
    tenant: enrichedTenant,
    allowedModuleIds,
    membership,
    user,
  }
}

export async function getTenantModuleAccess(slug, requiredModuleKey = null) {
  const result = await loadTenantModuleAccess(slug)

  if (!result.ok) {
    return result
  }

  if (requiredModuleKey) {
    const normalizedRequiredModule = normalizeModuleKey(requiredModuleKey)

    if (
      normalizedRequiredModule &&
      !result.allowedModuleIds.includes(normalizedRequiredModule)
    ) {
      return {
        ok: false,
        reason: "module_forbidden",
        redirectTo:
          result.allowedModuleIds.length > 0
            ? tenantModulePath(slug, result.allowedModuleIds[0])
            : tenantLoginPath(slug),
        tenant: result.tenant,
        allowedModuleIds: result.allowedModuleIds,
        membership: result.membership,
        user: result.user,
      }
    }
  }

  return result
}

export async function requireTenantModuleAccess(slug, requiredModuleKey) {
  const result = await getTenantModuleAccess(slug, requiredModuleKey)

  if (!result.ok) {
    redirect(result.redirectTo)
  }

  return result
}
