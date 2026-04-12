import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndMember(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user, membership }
}

export async function GET(req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const { searchParams } = new URL(req.url)
  const visibility = String(searchParams.get("visibility") || "all").trim()

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (incidentError || !incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  let query = supabase
    .from("incident_comments")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name,
        email
      )
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: true })

  if (visibility === "public" || visibility === "internal") {
    query = query.eq("visibility", visibility)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data || [] })
}

export async function POST(req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const commentBody = String(body.body || "").trim()
  const visibility = String(body.visibility || "public").trim()

  if (!commentBody) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }

  if (!["public", "internal"].includes(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 })
  }

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (incidentError || !incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  const { data: comment, error } = await supabase
    .from("incident_comments")
    .insert({
      incident_id: incident.id,
      created_by: user.id,
      body: commentBody,
      visibility,
    })
    .select(`
      *,
      profiles:created_by (
        id,
        full_name,
        email
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment })
}
