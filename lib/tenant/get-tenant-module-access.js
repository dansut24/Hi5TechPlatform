import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getTenantModuleAccess({ tenantId, userId }) {
  const supabase = await createSupabaseServerClient()

  const [{ data: directAssignments }, { data: groupMemberships }] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("module_key")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId),
    supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId),
  ])

  const groupIds = (groupMemberships || []).map((g) => g.group_id)

  let groupAssignments = []
  if (groupIds.length) {
    const { data } = await supabase
      .from("module_assignments")
      .select("module_key")
      .eq("tenant_id", tenantId)
      .in("group_id", groupIds)

    groupAssignments = data || []
  }

  const keys = new Set([
    ...(directAssignments || []).map((x) => x.module_key),
    ...groupAssignments.map((x) => x.module_key),
  ])

  return Array.from(keys)
}
