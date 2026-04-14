import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity/log-activity"

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

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id, role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const member = membership?.[0] || null

  if (membershipError || !member) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user, membership: member }
}

async function getIncidentForTenant(supabase, tenantId, incidentId) {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", incidentId)
    .limit(1)

  return {
    incident: data?.[0] || null,
    error,
  }
}

export async function GET(_req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { incident, error: incidentError } = await getIncidentForTenant(
    supabase,
    tenant.id,
    id
  )

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
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const commentBody = String(body.body || "").trim()
  if (!commentBody) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }

  const { incident, error: incidentError } = await getIncidentForTenant(
    supabase,
    tenant.id,
    id
  )

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

  await logActivity({
    tenantId: tenant.id,
    actorUserId: user.id,
    entityType: "incident",
    entityId: incident.id,
    eventType: "incident_public_comment_added",
    message: `Public comment added on ${incident.number}`,
    metadata: {
      number: incident.number,
      comment_id: comment.id,
      visibility: comment.visibility,
    },
  })

  return NextResponse.json({ comment })
}
