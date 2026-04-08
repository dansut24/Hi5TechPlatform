import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserControlPermissionContext } from "@/lib/permissions/control-server"

export async function getTenantAppData(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    throw new Error("Tenant not found")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error("Forbidden")
  }

  const { data: moduleAssignments, error: moduleAssignmentsError } = await supabase
    .from("module_assignments")
    .select("module_key")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (moduleAssignmentsError) {
    throw moduleAssignmentsError
  }

  const { data: groupRows, error: groupRowsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)

  if (groupRowsError) {
    throw groupRowsError
  }

  const groupIds = (groupRows || []).map((row) => row.group_id)

  let groupModuleAssignments = []
  if (groupIds.length > 0) {
    const { data: groupAssignments, error: groupAssignmentsError } = await supabase
      .from("group_module_assignments")
      .select("module_key, group_id")
      .eq("tenant_id", tenant.id)
      .in("group_id", groupIds)

    if (groupAssignmentsError) {
      throw groupAssignmentsError
    }

    groupModuleAssignments = groupAssignments || []
  }

  const directModuleKeys = (moduleAssignments || []).map((row) => row.module_key)
  const inheritedModuleKeys = groupModuleAssignments.map((row) => row.module_key)

  const mergedModuleAssignments = Array.from(
    new Set([...directModuleKeys, ...inheritedModuleKeys])
  )

  const { permissionContext: controlPermissionContext, effectiveCapabilities } =
    await getUserControlPermissionContext({
      tenantId: tenant.id,
      userId: user.id,
    })

  const permissionContext = {
    role: membership.role,
    roles: [membership.role],
    moduleAssignments: mergedModuleAssignments,
    controlCapabilities: controlPermissionContext.controlCapabilities || [],
    effectiveControlCapabilities: effectiveCapabilities || [],
  }

  return {
    tenant,
    tenantData: {
      ...tenant,
      permissionContext,
    },
  }
}
