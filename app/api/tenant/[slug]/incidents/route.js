import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

function nextIncidentNumber(existingCount) {
  const n = Number(existingCount || 0) + 1
  return `INC-${String(n).padStart(5, "0")}`
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim().toLowerCase()

    let query = access.admin
      .from("incidents")
      .select("*")
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error

    let incidents = data || []

    if (q) {
      incidents = incidents.filter((incident) =>
        `${incident.number || ""} ${incident.short_description || ""} ${incident.priority || ""} ${incident.status || ""}`
          .toLowerCase()
          .includes(q)
      )
    }

    return NextResponse.json({
      ok: true,
      incidents,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load incidents" },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "itsm")

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const shortDescription = body.shortDescription?.trim()
    const details = body.details?.trim() || null
    const priority = body.priority?.trim() || "medium"

    if (!shortDescription) {
      return NextResponse.json(
        { error: "Short description is required" },
        { status: 400 }
      )
    }

    const { count, error: countError } = await access.admin
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", access.tenant.id)

    if (countError) throw countError

    const number = nextIncidentNumber(count)

    const { data: incident, error } = await access.admin
      .from("incidents")
      .insert({
        tenant_id: access.tenant.id,
        number,
        short_description: shortDescription,
        description: details,
        priority,
        status: "new",
        created_by: access.user.id,
      })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      incident,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create incident" },
      { status: 500 }
    )
  }
}
