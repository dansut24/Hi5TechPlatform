import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(request, { params }) {
  try {
    const { slug } = params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const status = (searchParams.get("status") || "").trim().toLowerCase()

    const { data, error } = await access.admin
      .from("incidents")
      .select("*")
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    let incidents = data || []

    if (q) {
      incidents = incidents.filter((incident) =>
        `${incident.number || ""} ${incident.short_description || ""} ${incident.priority || ""} ${incident.status || ""}`
          .toLowerCase()
          .includes(q)
      )
    }

    if (status) {
      incidents = incidents.filter(
        (incident) => (incident.status || "").toLowerCase() === status
      )
    }

    return NextResponse.json({ ok: true, incidents })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load incidents" },
      { status: 500 }
    )
  }
}
