import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function logActivity({
  tenantId,
  actorUserId = null,
  entityType,
  entityId,
  eventType,
  message = null,
  metadata = {},
}) {
  if (!tenantId || !entityType || !entityId || !eventType) {
    return null
  }

  const supabase = await createServerSupabaseClient()

  const payload = {
    tenant_id: tenantId,
    actor_user_id: actorUserId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    message,
    metadata: metadata || {},
  }

  const { data, error } = await supabase
    .from("activity_log")
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error("[activity] log failed", error)
    return null
  }

  return data
}
