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
  const { slug, templateId } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("service_request_template_fields")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ fields: data || [] })
}

export async function POST(req, { params }) {
  const { slug, templateId } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const payload = {
    tenant_id: tenant.id,
    template_id: templateId,
    label: String(body.label || "").trim(),
    field_key: String(body.field_key || "").trim(),
    field_type: String(body.field_type || "text").trim(),
    placeholder: String(body.placeholder || "").trim() || null,
    help_text: String(body.help_text || "").trim() || null,
    is_required: Boolean(body.is_required),
    sort_order: Number(body.sort_order || 0),
    options_json: Array.isArray(body.options_json) ? body.options_json : null,
  }

  if (!payload.label || !payload.field_key) {
    return NextResponse.json({ error: "Label and field key are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("service_request_template_fields")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ field: data })
}
