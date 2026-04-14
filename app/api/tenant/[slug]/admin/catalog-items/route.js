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
    .from("service_catalog_items")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data || [] })
}

export async function POST(req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const payload = {
    tenant_id: tenant.id,
    category_id: body.category_id || null,
    template_id: body.template_id || null,
    name: String(body.name || "").trim(),
    short_description: String(body.short_description || "").trim() || null,
    full_description: String(body.full_description || "").trim() || null,
    icon: String(body.icon || "").trim() || null,
    sort_order: Number(body.sort_order || 0),
    is_active: body.is_active !== false,
    request_type: String(body.request_type || "Service Catalog Request").trim(),
    approval_required: Boolean(body.approval_required),
    default_priority: String(body.default_priority || "medium").trim(),
  }

  if (!payload.name) {
    return NextResponse.json({ error: "Item name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("service_catalog_items")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

export async function PUT(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const itemId = String(body.id || "").trim()
  if (!itemId) {
    return NextResponse.json({ error: "Item id is required" }, { status: 400 })
  }

  const updates = {}
  if ("category_id" in body) updates.category_id = body.category_id || null
  if ("template_id" in body) updates.template_id = body.template_id || null
  if ("name" in body) updates.name = String(body.name || "").trim()
  if ("short_description" in body) updates.short_description = String(body.short_description || "").trim() || null
  if ("full_description" in body) updates.full_description = String(body.full_description || "").trim() || null
  if ("icon" in body) updates.icon = String(body.icon || "").trim() || null
  if ("sort_order" in body) updates.sort_order = Number(body.sort_order || 0)
  if ("is_active" in body) updates.is_active = Boolean(body.is_active)
  if ("request_type" in body) updates.request_type = String(body.request_type || "Service Catalog Request").trim()
  if ("approval_required" in body) updates.approval_required = Boolean(body.approval_required)
  if ("default_priority" in body) updates.default_priority = String(body.default_priority || "medium").trim()

  const { data, error } = await supabase
    .from("service_catalog_items")
    .update(updates)
    .eq("tenant_id", tenant.id)
    .eq("id", itemId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}
