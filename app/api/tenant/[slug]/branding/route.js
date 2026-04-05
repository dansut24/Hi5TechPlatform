import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function POST(req, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json()

    const payload = {
      logo_url: body.logo_url || null,
      brand_hex: body.brand_hex || null,
      brand_dark_hex: body.brand_dark_hex || null,
      login_heading: body.login_heading || null,
      login_message: body.login_message || null,
    }

    const { error } = await access.admin
      .from("tenants")
      .update(payload)
      .eq("id", access.tenant.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save branding" },
      { status: 500 }
    )
  }
}
