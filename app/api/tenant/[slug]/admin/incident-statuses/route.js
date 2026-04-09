import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndAdmin(slug) {
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
    .select("id, slug")
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

  if (
    membershipError ||
    !membership ||
    !["owner", "admin"].includes(String(membership.role || "").toLowerCase())
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant }
}

export async function GET(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("incident_statuses")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ statuses: data || [] })
}

export async function POST(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const payload = {
    tenant_id: tenant.id,
    key: String(body.key || "").trim().toLowerCase(),
    label: String(body.label || "").trim(),
    category: String(body.category || "open").trim(),
    color: String(body.color || "").trim() || null,
    sort_order: Number(body.sort_order || 0),
    is_active: body.is_active !== false,
    pauses_sla: Boolean(body.pauses_sla),
    is_resolved: Boolean(body.is_resolved),
    is_closed: Boolean(body.is_closed),
  }

  if (!payload.key || !payload.label) {
    return NextResponse.json({ error: "Key and label are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("incident_statuses")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: data })
}

export async function PUT(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const id = String(body.id || "").trim()
  if (!id) {
    return NextResponse.json({ error: "Status id is required" }, { status: 400 })
  }

  const updates = {
    key: String(body.key || "").trim().toLowerCase(),
    label: String(body.label || "").trim(),
    category: String(body.category || "open").trim(),
    color: String(body.color || "").trim() || null,
    sort_order: Number(body.sort_order || 0),
    is_active: Boolean(body.is_active),
    pauses_sla: Boolean(body.pauses_sla),
    is_resolved: Boolean(body.is_resolved),
    is_closed: Boolean(body.is_closed),
  }

  const { data, error } = await supabase
    .from("incident_statuses")
    .update(updates)
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: data })
}
