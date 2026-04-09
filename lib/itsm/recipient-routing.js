import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getIncidentNotificationRecipient({
  tenantId,
  assignmentGroupId,
  assignedTo,
}) {
  const supabase = await createServerSupabaseClient()

  if (assignedTo) {
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", assignedTo)
      .maybeSingle()

    if (data?.email) return data.email
  }

  if (assignmentGroupId) {
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", assignmentGroupId)

    const firstUserId = members?.[0]?.user_id
    if (firstUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", firstUserId)
        .maybeSingle()

      if (profile?.email) return profile.email
    }
  }

  const { data: tenantUsers } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenantId)

  const adminUser = (tenantUsers || []).find((row) =>
    ["owner", "admin"].includes(String(row.role || "").toLowerCase())
  )

  if (adminUser?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", adminUser.user_id)
      .maybeSingle()

    if (profile?.email) return profile.email
  }

  return null
}
