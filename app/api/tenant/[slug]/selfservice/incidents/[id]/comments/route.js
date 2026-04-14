import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendIncidentRequesterCommentNotification } from "@/lib/itsm/notifications"
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

export async function GET(_req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndRequester(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .eq("created_by", user.id)
    .single()

  if (incidentError || !incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("incident_comments")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name,
        email
      )
    `)
    .eq("incident_id", id)
    .eq("visibility", "public")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data || [] })
}

export async function POST(req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndRequester(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const commentBody = String(body.body || "").trim()
  if (!commentBody) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }

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

  const { data: comment, error } = await supabase
    .from("incident_comments")
    .insert({
      incident_id: incident.id,
      created_by: user.id,
      body: commentBody,
      visibility: "public",
    })
    .select(`
      *,
      profiles:created_by (
        id,
        full_name,
        email
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const activity = await logActivity({
    tenantId: tenant.id,
    actorUserId: user.id,
    entityType: "incident",
    entityId: incident.id,
    eventType: "incident_comment_added",
    message: `Requester added a comment on ${incident.number}`,
    metadata: {
      number: incident.number,
      comment_id: comment.id,
      visibility: comment.visibility,
    },
  })

  try {
    const notifyTo = await getIncidentNotificationRecipient({
      tenantId: tenant.id,
      assignmentGroupId: incident.assignment_group_id,
      assignedTo: incident.assigned_to,
    })

    await sendIncidentRequesterCommentNotification({
      tenantName: tenant.name || tenant.slug,
      incident,
      commentBody,
      notifyTo,
    })
  } catch (notifyError) {
    console.error("[itsm-email] requester comment notification failed", notifyError)
  }

  try {
    await dispatchActivityNotifications({
      activity,
      incident,
    })
  } catch (notificationError) {
    console.error("[activity-notifications] requester comment failed", notificationError)
  }

  return NextResponse.json({ comment })
}
