import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function createNotification({
  tenantId,
  userId,
  type,
  title,
  body = null,
  entityType = null,
  entityId = null,
  link = null,
  moduleId = null,
}) {
  if (!tenantId || !userId || !type || !title) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type,
      title,
      body,
      entity_type: entityType,
      entity_id: entityId,
      link,
      module_id: moduleId,
    })
    .select()
    .single()

  if (error) {
    console.error("[notifications] create failed", error)
    return null
  }

  return data
}
