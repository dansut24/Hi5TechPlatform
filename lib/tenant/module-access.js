import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { tenantLoginPath, tenantModulePath } from "@/lib/tenant/paths"
import { getUserControlPermissionContext } from "@/lib/permissions/control-server"

function normalizeModuleKey(value) {
  return String(value || "").trim().toLowerCase()
}

export async function requireTenantModuleAccess(slug, requiredModuleKey) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect(tenantLoginPath(slug))
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    redirect("/login")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    redirect(tenantLoginPath(slug))
  }

  const isTenantAdmin = ["owner", "admin"].includes(String(membership.role || "").toLowerCase())

  const { data: directAssignments, error: directAssignmentsError } = await supabase
    .from("module_assignments")
    .select("module_key")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (directAssignmentsError) {
    throw new Error(directAssignmentsError.message || "Failed to load direct module assignments")
  }

  const { data: groupMemberships, error: groupMembershipsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (groupMembershipsError) {
    throw new Error(groupMembershipsError.message || "Failed to load group memberships")
  }

  const groupIds = (groupMemberships || []).map((row) => row.group_id)

  let groupAssignments = []
  if (groupIds.length > 0) {
    const { data, error } = await supabase
      .from("group_module_assignments")
      .select("group_id, module_key")
      .eq("tenant_id", tenant.id)
      .in("group_id", groupIds)

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
      new Set([...allowedModuleIds, "itsm", "control", "selfservice", "admin", "analytics", "automation"])
    )
  }

  const normalizedRequiredModule = normalizeModuleKey(requiredModuleKey)

  if (
    normalizedRequiredModule &&
    !allowedModuleIds.includes(normalizedRequiredModule)
  ) {
    if (allowedModuleIds.length > 0) {
      redirect(tenantModulePath(slug, allowedModuleIds[0]))
    }
    redirect(tenantLoginPath(slug))
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
    tenant: enrichedTenant,
    allowedModuleIds,
    membership,
  }
}
