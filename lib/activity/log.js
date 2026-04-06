import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function logActivity({
  tenantId,
  entityType,
  entityId,
  eventType,
  actorUserId = null,
  message = null,
  metadata = {},
}) {
  const admin = getSupabaseAdminClient()

  const { error } = await admin
    .from("activity_log")
    .insert({
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      actor_user_id: actorUserId,
      message,
      metadata,
    })

  if (error) {
    throw error
  }
}
