import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

const PRIORITY_ORDER = ["critical", "high", "medium", "low"]

export async function GET(_request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: incidents, error } = await access.admin
      .from("incidents")
      .select("id, number, short_description, priority, status, created_at")
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const rows = incidents || []

    const openStatuses = new Set(["new", "open", "in_progress", "pending"])
    const openIncidents = rows.filter((row) => openStatuses.has((row.status || "").toLowerCase()))
    const breachRisk = rows.filter((row) => ["critical", "high"].includes((row.priority || "").toLowerCase()) && openStatuses.has((row.status || "").toLowerCase()))
    const pendingChanges = 0
    const healthyAssets = "96.2%"

    const byPriority = PRIORITY_ORDER.map((priority) => ({
      priority,
      count: rows.filter((row) => (row.priority || "").toLowerCase() === priority).length,
    }))

    const recentIncidents = rows.slice(0, 5)

    return NextResponse.json({
      ok: true,
      summary: {
        openIncidents: openIncidents.length,
        breachRisk: breachRisk.length,
        pendingChanges,
        healthyAssets,
        byPriority,
        recentIncidents,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load ITSM summary" },
      { status: 500 }
    )
  }
}
