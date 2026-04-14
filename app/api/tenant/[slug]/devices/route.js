import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(_request, { params }) {
  try {
    const { slug } = params
    const access = await requireTenantApiAccess(slug, "control")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: devices, error } = await access.admin
      .from("devices")
      .select("*")
      .eq("tenant_id", access.tenant.id)
      .order("last_seen_at", { ascending: false, nullsFirst: false })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      devices: devices || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load devices" },
      { status: 500 }
    )
  }
}
