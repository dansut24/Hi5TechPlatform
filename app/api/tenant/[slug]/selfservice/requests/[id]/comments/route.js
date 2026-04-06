import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { logActivity } from "@/lib/activity/log"

async function attachProfiles(admin, rows, userIdField) {
  const ids = [...new Set((rows || []).map((row) => row[userIdField]).filter(Boolean))]
  if (!ids.length) {
    return (rows || []).map((row) => ({ ...row, profiles: null }))
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids)

  if (error) throw error

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  return (rows || []).map((row) => ({
    ...row,
    profiles: row[userIdField] ? profileMap.get(row[userIdField]) || null : null,
  }))
}

export async function GET(_request, { params }) {
  try {
    const { slug, id } = await params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: requestItem, error: requestError } = await access.admin
      .from("service_requests")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .maybeSingle()

    if (requestError) throw requestError
    if (!requestItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const { data, error } = await access.admin
      .from("request_comments")
      .select("id, body, created_at, author_user_id")
      .eq("request_id", id)
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: true })

    if (error) throw error

    const comments = await attachProfiles(access.admin, data || [], "author_user_id")

    return NextResponse.json({ ok: true, comments })
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
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const comment = body.body?.trim()

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const { data: requestItem, error: requestError } = await access.admin
      .from("service_requests")
      .select("id, number")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .maybeSingle()

    if (requestError) throw requestError
    if (!requestItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const { data, error } = await access.admin
      .from("request_comments")
      .insert({
        request_id: id,
        tenant_id: access.tenant.id,
        author_user_id: access.user.id,
        body: comment,
      })
      .select("id, body, created_at, author_user_id")
      .single()

    if (error) throw error

    const [commentWithProfile] = await attachProfiles(access.admin, [data], "author_user_id")

    await logActivity({
      tenantId: access.tenant.id,
      entityType: "request",
      entityId: id,
      eventType: "comment_added",
      actorUserId: access.user.id,
      message: `Comment added to ${requestItem.number}`,
      metadata: {
        comment_preview: comment.slice(0, 120),
      },
    })

    return NextResponse.json({ ok: true, comment: commentWithProfile })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to add comment" },
      { status: 500 }
    )
  }
}
