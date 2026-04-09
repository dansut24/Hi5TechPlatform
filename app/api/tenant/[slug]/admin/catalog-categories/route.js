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
    .from("service_catalog_categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories: data || [] })
}

export async function POST(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const payload = {
    tenant_id: tenant.id,
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim() || null,
    sort_order: Number(body.sort_order || 0),
    is_active: body.is_active !== false,
  }

  if (!payload.name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("service_catalog_categories")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category: data })
}

export async function PUT(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const id = String(body.id || "").trim()
  if (!id) {
    return NextResponse.json({ error: "Category id is required" }, { status: 400 })
  }

  const updates = {}
  if ("name" in body) updates.name = String(body.name || "").trim()
  if ("description" in body) updates.description = String(body.description || "").trim() || null
  if ("sort_order" in body) updates.sort_order = Number(body.sort_order || 0)
  if ("is_active" in body) updates.is_active = Boolean(body.is_active)

  const { data, error } = await supabase
    .from("service_catalog_categories")
    .update(updates)
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category: data })
}
