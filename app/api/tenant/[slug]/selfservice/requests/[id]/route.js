import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(_request, { params }) {
  try {
    const { slug, id } = params
    const access = await requireTenantApiAccess(slug, "selfservice")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: requestItem, error } = await access.admin
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", access.tenant.id)
      .eq("created_by", access.user.id)
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
