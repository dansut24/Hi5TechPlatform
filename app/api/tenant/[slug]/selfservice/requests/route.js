import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const status = (searchParams.get("status") || "").trim().toLowerCase()

    const { data, error } = await access.admin
      .from("service_requests")
      .select("*")
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    let requests = data || []

    if (q) {
      requests = requests.filter((requestRow) =>
        `${requestRow.number || ""} ${requestRow.request_type || ""} ${requestRow.requested_for || ""} ${requestRow.status || ""}`
          .toLowerCase()
          .includes(q)
      )
    }

    if (status) {
      requests = requests.filter(
        (requestRow) => (requestRow.status || "").toLowerCase() === status
      )
    }

    return NextResponse.json({ ok: true, requests })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load requests" },
      { status: 500 }
    )
  }
}
