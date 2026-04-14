import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(_request, { params }) {
  try {
    const { slug } = params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: incidents, error: incidentsError } = await access.admin
      .from("incidents")
      .select("id, number, short_description, priority, status, created_at")
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .order("created_at", { ascending: false })

    if (incidentsError) throw incidentsError

    const { data: requests, error: requestsError } = await access.admin
      .from("service_requests")
      .select("id, number, request_type, requested_for, status, created_at")
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .order("created_at", { ascending: false })

    if (requestsError) throw requestsError

    const openStatuses = new Set(["new", "open", "in_progress", "pending"])

    return NextResponse.json({
      ok: true,
      summary: {
        myIncidents: incidents?.length || 0,
        myOpenIncidents: (incidents || []).filter((row) => openStatuses.has((row.status || "").toLowerCase())).length,
        myRequests: requests?.length || 0,
        myOpenRequests: (requests || []).filter((row) => openStatuses.has((row.status || "").toLowerCase())).length,
        recentIncidents: (incidents || []).slice(0, 5),
        recentRequests: (requests || []).slice(0, 5),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load self service summary" },
      { status: 500 }
    )
  }
}
