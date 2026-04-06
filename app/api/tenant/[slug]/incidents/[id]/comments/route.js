import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { logActivity } from "@/lib/activity/log"

export async function GET(_request, { params }) {
  try {
    const { slug, id } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: incident, error: incidentError } = await access.admin
      .from("incidents")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (incidentError) throw incidentError

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    const { data, error } = await access.admin
      .from("incident_comments")
      .select(`
        id,
        body,
        created_at,
        author_user_id,
        profiles:author_user_id (
          id,
          full_name,
          email
        )
      `)
      .eq("incident_id", id)
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ ok: true, comments: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load comments" },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { slug, id } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const comment = body.body?.trim()

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const { data: incident, error: incidentError } = await access.admin
      .from("incidents")
      .select("id, number")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (incidentError) throw incidentError

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    const { data, error } = await access.admin
      .from("incident_comments")
      .insert({
        incident_id: id,
        tenant_id: access.tenant.id,
        author_user_id: access.user.id,
        body: comment,
      })
      .select(`
        id,
        body,
        created_at,
        author_user_id,
        profiles:author_user_id (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) throw error

    await logActivity({
      tenantId: access.tenant.id,
      entityType: "incident",
      entityId: id,
      eventType: "comment_added",
      actorUserId: access.user.id,
      message: `Comment added to ${incident.number}`,
      metadata: {
        comment_preview: comment.slice(0, 120),
      },
    })

    return NextResponse.json({ ok: true, comment: data })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to add comment" },
      { status: 500 }
    )
  }
}
