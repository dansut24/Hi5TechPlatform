import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTenantItsmSettingsByTenantId } from "@/lib/itsm/settings"
import {
  sendIncidentResolvedEmail,
  sendIncidentUpdatedEmail,
} from "@/lib/itsm/notifications"
import { logActivity } from "@/lib/activity/log-activity"
import { dispatchActivityNotifications } from "@/lib/activity/dispatch-activity-notifications"

async function getTenantAndMember(slug) {
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

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user, membership }
}

export async function GET(_req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ incident: data })
}

export async function PATCH(req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const { data: currentIncident, error: currentIncidentError } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (currentIncidentError || !currentIncident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  const updates = {}

  if ("status" in body) updates.status = String(body.status || "").trim()
  if ("priority" in body) updates.priority = String(body.priority || "").trim()
  if ("assigned_to" in body) updates.assigned_to = body.assigned_to || null
  if ("assignment_group_id" in body) updates.assignment_group_id = body.assignment_group_id || null
  if ("resolution_notes" in body) {
    updates.resolution_notes = String(body.resolution_notes || "").trim() || null
  }

  let selectedStatus = null
  if (updates.status) {
    const { data: statusRows, error: statusError } = await supabase
      .from("incident_statuses")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("key", updates.status)
      .limit(1)

    const statusRow = statusRows?.[0] || null

    if (statusError || !statusRow) {
      return NextResponse.json({ error: "Invalid incident status" }, { status: 400 })
    }

    selectedStatus = statusRow

    if (statusRow.is_resolved) {
      updates.resolved_at = currentIncident.resolved_at || new Date().toISOString()
    } else {
      updates.resolved_at = null
    }

    if (statusRow.is_closed) {
      updates.closed_at = currentIncident.closed_at || new Date().toISOString()
    } else {
      updates.closed_at = null
    }
  }

  const { data: incidentRows, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select()
    .limit(1)

  const incident = incidentRows?.[0] || null

  if (error || !incident) {
    return NextResponse.json({ error: error?.message || "Failed to update incident" }, { status: 500 })
  }

  const activityEvents = []

  if ("status" in body && currentIncident.status !== incident.status) {
    activityEvents.push(
      await logActivity({
        tenantId: tenant.id,
        actorUserId: user.id,
        entityType: "incident",
        entityId: incident.id,
        eventType: selectedStatus?.is_resolved ? "incident_resolved" : "incident_status_changed",
        message: selectedStatus?.is_resolved
          ? `Incident ${incident.number} resolved`
          : `Status changed from ${currentIncident.status} to ${incident.status}`,
        metadata: {
          number: incident.number,
          from_status: currentIncident.status,
          to_status: incident.status,
        },
      })
    )
  }

  if ("priority" in body && currentIncident.priority !== incident.priority) {
    activityEvents.push(
      await logActivity({
        tenantId: tenant.id,
        actorUserId: user.id,
        entityType: "incident",
        entityId: incident.id,
        eventType: "incident_priority_changed",
        message: `Priority changed from ${currentIncident.priority} to ${incident.priority}`,
        metadata: {
          number: incident.number,
          from_priority: currentIncident.priority,
          to_priority: incident.priority,
        },
      })
    )
  }

  if ("assigned_to" in body && currentIncident.assigned_to !== incident.assigned_to) {
    activityEvents.push(
      await logActivity({
        tenantId: tenant.id,
        actorUserId: user.id,
        entityType: "incident",
        entityId: incident.id,
        eventType: "incident_assigned",
        message: incident.assigned_to ? `Incident assigned to user` : "Incident unassigned",
        metadata: {
          number: incident.number,
          from_assigned_to: currentIncident.assigned_to,
          to_assigned_to: incident.assigned_to,
        },
      })
    )
  }

  if (
    "assignment_group_id" in body &&
    currentIncident.assignment_group_id !== incident.assignment_group_id
  ) {
    activityEvents.push(
      await logActivity({
        tenantId: tenant.id,
        actorUserId: user.id,
        entityType: "incident",
        entityId: incident.id,
        eventType: "incident_group_changed",
        message: "Assignment group updated",
        metadata: {
          number: incident.number,
          from_assignment_group_id: currentIncident.assignment_group_id,
          to_assignment_group_id: incident.assignment_group_id,
        },
      })
    )
  }

  if (
    "resolution_notes" in body &&
    String(currentIncident.resolution_notes || "") !== String(incident.resolution_notes || "")
  ) {
    activityEvents.push(
      await logActivity({
        tenantId: tenant.id,
        actorUserId: user.id,
        entityType: "incident",
        entityId: incident.id,
        eventType: "incident_resolution_updated",
        message: "Resolution notes updated",
        metadata: {
          number: incident.number,
        },
      })
    )
  }

  try {
    const itsmSettings = await getTenantItsmSettingsByTenantId(tenant.id)

    if (selectedStatus?.is_resolved && itsmSettings.send_resolution_emails) {
      await sendIncidentResolvedEmail({
        tenantName: tenant.name || tenant.slug,
        incident,
        surveyUrl: itsmSettings.survey_enabled ? itsmSettings.survey_url : null,
      })
    } else if (
      itsmSettings.send_requester_update_emails &&
      (
        "status" in body ||
        "assigned_to" in body ||
        "assignment_group_id" in body ||
        "resolution_notes" in body ||
        "priority" in body
      )
    ) {
      await sendIncidentUpdatedEmail({
        tenantName: tenant.name || tenant.slug,
        incident,
        statusLabel: selectedStatus?.label || incident.status,
      })
    }
  } catch (emailError) {
    console.error("[itsm-email] incident update email failed", emailError)
  }

  try {
    for (const activity of activityEvents.filter(Boolean)) {
      await dispatchActivityNotifications({
        activity,
        incident,
      })
    }
  } catch (notificationError) {
    console.error("[activity-notifications] incident update failed", notificationError)
  }

  return NextResponse.json({ incident })
}
