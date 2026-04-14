import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendIncidentReopenedNotification } from "@/lib/itsm/notifications"
import { getIncidentNotificationRecipient } from "@/lib/itsm/recipient-routing"
import { logActivity } from "@/lib/activity/log-activity"
import { dispatchActivityNotifications } from "@/lib/activity/dispatch-activity-notifications"

async function getTenantAndRequester(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user }
}

export async function POST(_req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndRequester(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .eq("created_by", user.id)
    .single()

  if (incidentError || !incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  const { data: openStatuses, error: statusError } = await supabase
    .from("incident_statuses")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .eq("category", "open")
    .order("sort_order", { ascending: true })

  if (statusError || !openStatuses?.length) {
    return NextResponse.json(
      { error: "No available open status found for reopen flow" },
      { status: 400 }
    )
  }

  const reopenStatus = openStatuses[0]

  const { data: updatedIncident, error: updateError } = await supabase
    .from("incidents")
    .update({
      status: reopenStatus.key,
      resolved_at: null,
      closed_at: null,
    })
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const activity = await logActivity({
    tenantId: tenant.id,
    actorUserId: user.id,
    entityType: "incident",
    entityId: updatedIncident.id,
    eventType: "incident_reopened",
    message: `Incident ${updatedIncident.number} reopened`,
    metadata: {
      number: updatedIncident.number,
      reopened_to_status: updatedIncident.status,
    },
  })

  try {
    const notifyTo = await getIncidentNotificationRecipient({
      tenantId: tenant.id,
      assignmentGroupId: incident.assignment_group_id,
      assignedTo: incident.assigned_to,
    })

    await sendIncidentReopenedNotification({
      tenantName: tenant.name || tenant.slug,
      incident: updatedIncident,
      notifyTo,
    })
  } catch (notifyError) {
    console.error("[itsm-email] incident reopen notification failed", notifyError)
  }

  try {
    await dispatchActivityNotifications({
      activity,
      incident: updatedIncident,
    })
  } catch (notificationError) {
    console.error("[activity-notifications] incident reopen failed", notificationError)
  }

  return NextResponse.json({ incident: updatedIncident })
}
