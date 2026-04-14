import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { logActivity } from "@/lib/activity/log"

const ALLOWED_STATUSES = ["new", "open", "pending", "in_progress", "resolved", "closed", "cancelled"]

export async function GET(_request, { params }) {
  try {
    const { slug, id } = params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: requestItem, error } = await access.admin
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (error) throw error

    if (!requestItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, request: requestItem })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load request" },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const { slug, id } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const nextStatus = body.status?.trim()?.toLowerCase()

    if (!nextStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const { data: current, error: currentError } = await access.admin
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (currentError) throw currentError

    if (!current) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const { data: requestItem, error } = await access.admin
      .from("service_requests")
      .update({ status: nextStatus })
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .select("*")
      .single()

    if (error) throw error

    if (nextStatus !== current.status) {
      await logActivity({
        tenantId: access.tenant.id,
        entityType: "request",
        entityId: id,
        eventType: "status_changed",
        actorUserId: access.user.id,
        message: `Status changed from ${current.status} to ${nextStatus}`,
        metadata: {
          from: current.status,
          to: nextStatus,
        },
      })
    }

    return NextResponse.json({ ok: true, request: requestItem })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update request" },
      { status: 500 }
    )
  }
}
