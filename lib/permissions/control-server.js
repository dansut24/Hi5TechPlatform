import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getControlCapabilities } from "@/lib/permissions/control"

export async function getUserControlPermissionContext({ tenantId, userId }) {
  const supabase = await createServerSupabaseClient()

  const [userCapsRes, membershipRes, groupCapsRes] = await Promise.all([
    supabase
      .from("user_control_capabilities")
      .select("capability")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId),

    supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId),

    supabase
      .from("group_control_capabilities")
      .select("group_id, capability")
      .eq("tenant_id", tenantId),
  ])

  if (userCapsRes.error) throw userCapsRes.error
  if (membershipRes.error) throw membershipRes.error
  if (groupCapsRes.error) throw groupCapsRes.error

  const memberGroupIds = new Set((membershipRes.data || []).map((row) => row.group_id))

  const inheritedGroupCapabilities = (groupCapsRes.data || [])
    .filter((row) => memberGroupIds.has(row.group_id))
    .map((row) => row.capability)

  const directCapabilities = (userCapsRes.data || []).map((row) => row.capability)

  const permissionContext = {
    controlCapabilities: [...directCapabilities, ...inheritedGroupCapabilities],
  }

  return {
    permissionContext,
    effectiveCapabilities: getControlCapabilities(permissionContext),
  }
}
