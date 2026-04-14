import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

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
    const { slug, entityType, id } = params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    if (!["incident", "request"].includes(entityType)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 })
    }

    if (entityType === "incident") {
      const { data: incident, error: incidentError } = await access.admin
        .from("incidents")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", access.tenant.id)
        .eq("created_by", access.user.id)
        .maybeSingle()

      if (incidentError) throw incidentError
      if (!incident) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 })
      }
    }

    if (entityType === "request") {
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
    }

    const { data, error } = await access.admin
      .from("activity_log")
      .select("id, entity_type, entity_id, event_type, actor_user_id, message, metadata, created_at")
      .eq("tenant_id", access.tenant.id)
      .eq("entity_type", entityType)
      .eq("entity_id", id)
      .order("created_at", { ascending: true })

    if (error) throw error

    const activity = await attachProfiles(access.admin, data || [], "actor_user_id")

    return NextResponse.json({ ok: true, activity })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load activity" },
      { status: 500 }
    )
  }
}
