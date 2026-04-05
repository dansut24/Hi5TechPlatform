import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

function nextRequestNumber(existingCount) {
  const n = Number(existingCount || 0) + 1
  return `REQ-${String(n).padStart(5, "0")}`
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

    const { data, error } = await access.admin
      .from("service_requests")
      .select("*")
      .eq("tenant_id", access.tenant.id)
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

    return NextResponse.json({
      ok: true,
      requests,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load service requests" },
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
    const requestType = body.requestType?.trim()
    const requestedFor = body.requestedFor?.trim() || null
    const notes = body.notes?.trim() || null

    if (!requestType) {
      return NextResponse.json(
        { error: "Request type is required" },
        { status: 400 }
      )
    }

    const { count, error: countError } = await access.admin
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", access.tenant.id)

    if (countError) throw countError

    const number = nextRequestNumber(count)

    const { data: serviceRequest, error } = await access.admin
      .from("service_requests")
      .insert({
        tenant_id: access.tenant.id,
        number,
        request_type: requestType,
        requested_for: requestedFor,
        notes,
        status: "new",
        created_by: access.user.id,
      })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      request: serviceRequest,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create service request" },
      { status: 500 }
    )
  }
}
