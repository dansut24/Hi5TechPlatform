import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DEFAULT_ITSM_SETTINGS } from "@/lib/itsm/settings"

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
    .select("id, slug, name")
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
    .from("tenant_itsm_settings")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name", { ascending: true })

  if (groupsError) {
    return NextResponse.json({ error: groupsError.message }, { status: 500 })
  }

  return NextResponse.json({
    settings: {
      ...DEFAULT_ITSM_SETTINGS,
      ...(data || {}),
    },
    groups: groups || [],
  })
}

export async function PUT(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const values = {
    tenant_id: tenant.id,
    default_triage_group_id: body.default_triage_group_id || null,
    send_requester_confirmation_emails: Boolean(body.send_requester_confirmation_emails),
    send_requester_update_emails: Boolean(body.send_requester_update_emails),
    send_resolution_emails: Boolean(body.send_resolution_emails),
    auto_close_resolved_enabled: Boolean(body.auto_close_resolved_enabled),
    auto_close_resolved_hours: Math.max(1, Number(body.auto_close_resolved_hours || 72)),
    survey_enabled: Boolean(body.survey_enabled),
    survey_url: String(body.survey_url || "").trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("tenant_itsm_settings")
    .upsert(values, { onConflict: "tenant_id" })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
