import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { logActivity } from "@/lib/activity/log"

const ALLOWED_STATUSES = ["new", "open", "pending", "in_progress", "resolved", "closed", "cancelled"]
const ALLOWED_PRIORITIES = ["low", "medium", "high", "critical"]

export async function GET(_request, { params }) {
  try {
    const { slug, id } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: incident, error } = await access.admin
      .from("incidents")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (error) throw error

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, incident })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load incident" },
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
    const nextPriority = body.priority?.trim()?.toLowerCase()

    if (!nextStatus && !nextPriority) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      )
    }

    if (nextStatus && !ALLOWED_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    if (nextPriority && !ALLOWED_PRIORITIES.includes(nextPriority)) {
      return NextResponse.json(
        { error: "Invalid priority" },
        { status: 400 }
      )
    }

    const { data: current, error: currentError } = await access.admin
      .from("incidents")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .maybeSingle()

    if (currentError) throw currentError

    if (!current) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    const patch = {}
    if (nextStatus) patch.status = nextStatus
    if (nextPriority) patch.priority = nextPriority

    const { data: incident, error } = await access.admin
      .from("incidents")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .select("*")
      .single()

    if (error) throw error

    if (nextStatus && nextStatus !== current.status) {
      await logActivity({
        tenantId: access.tenant.id,
        entityType: "incident",
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

    if (nextPriority && nextPriority !== current.priority) {
      await logActivity({
        tenantId: access.tenant.id,
        entityType: "incident",
        entityId: id,
        eventType: "priority_changed",
        actorUserId: access.user.id,
        message: `Priority changed from ${current.priority} to ${nextPriority}`,
        metadata: {
          from: current.priority,
          to: nextPriority,
        },
      })
    }

    return NextResponse.json({ ok: true, incident })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update incident" },
      { status: 500 }
    )
  }
}
