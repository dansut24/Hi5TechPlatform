import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const DEFAULT_SETTINGS = {
  idle_timeout_minutes: 15,
  absolute_session_timeout_minutes: 480,
  remember_device_enabled: true,
  remember_device_days: 30,
  reauth_for_sensitive_actions: true,
  max_concurrent_sessions: 5,
}

async function getTenantAndAdmin(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership || !["owner", "admin"].includes(String(membership.role || "").toLowerCase())) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user, membership }
}

function sanitize(body = {}) {
  return {
    idle_timeout_minutes: Math.max(1, Math.min(1440, Number(body.idle_timeout_minutes ?? DEFAULT_SETTINGS.idle_timeout_minutes))),
    absolute_session_timeout_minutes: Math.max(5, Math.min(10080, Number(body.absolute_session_timeout_minutes ?? DEFAULT_SETTINGS.absolute_session_timeout_minutes))),
    remember_device_enabled: Boolean(body.remember_device_enabled),
    remember_device_days: Math.max(1, Math.min(365, Number(body.remember_device_days ?? DEFAULT_SETTINGS.remember_device_days))),
    reauth_for_sensitive_actions: Boolean(body.reauth_for_sensitive_actions),
    max_concurrent_sessions: Math.max(1, Math.min(100, Number(body.max_concurrent_sessions ?? DEFAULT_SETTINGS.max_concurrent_sessions))),
  }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("tenant_security_settings")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({
      settings: {
        tenant_id: tenant.id,
        ...DEFAULT_SETTINGS,
      },
    })
  }

  return NextResponse.json({ settings: data })
}

export async function PUT(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()
  const values = sanitize(body)

  const { data, error } = await supabase
    .from("tenant_security_settings")
    .upsert(
      {
        tenant_id: tenant.id,
        ...values,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
