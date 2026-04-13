import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const DEFAULT_SESSION_SETTINGS = {
  idle_timeout_minutes: 30,
  warning_minutes_before: 5,
  remember_device_days: 30,
  require_2fa_for_admin: false,
  require_2fa_for_control: false,
}

async function getTenantAndMember(slug) {
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

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null

  if (membershipError || !membership) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, membership, user }
}

export async function GET(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("tenant_session_settings")
    .select("*")
    .eq("tenant_id", tenant.id)
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const row = data?.[0] || null

  return NextResponse.json({
    settings: {
      ...DEFAULT_SESSION_SETTINGS,
      ...(row || {}),
    },
  })
}

export async function PATCH(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, membership } = ctx

  if (!["owner", "admin"].includes(String(membership.role || "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  const idleTimeoutMinutes = Number(body.idle_timeout_minutes)
  const warningMinutesBefore = Number(body.warning_minutes_before)
  const rememberDeviceDays = Number(body.remember_device_days)
  const require2faForAdmin = Boolean(body.require_2fa_for_admin)
  const require2faForControl = Boolean(body.require_2fa_for_control)

  if (!Number.isFinite(idleTimeoutMinutes) || idleTimeoutMinutes < 5 || idleTimeoutMinutes > 1440) {
    return NextResponse.json(
      { error: "idle_timeout_minutes must be between 5 and 1440" },
      { status: 400 }
    )
  }

  if (
    !Number.isFinite(warningMinutesBefore) ||
    warningMinutesBefore < 1 ||
    warningMinutesBefore >= idleTimeoutMinutes
  ) {
    return NextResponse.json(
      { error: "warning_minutes_before must be at least 1 and less than idle_timeout_minutes" },
      { status: 400 }
    )
  }

  if (!Number.isFinite(rememberDeviceDays) || rememberDeviceDays < 1 || rememberDeviceDays > 365) {
    return NextResponse.json(
      { error: "remember_device_days must be between 1 and 365" },
      { status: 400 }
    )
  }

  const payload = {
    tenant_id: tenant.id,
    idle_timeout_minutes: idleTimeoutMinutes,
    warning_minutes_before: warningMinutesBefore,
    remember_device_days: rememberDeviceDays,
    require_2fa_for_admin: require2faForAdmin,
    require_2fa_for_control: require2faForControl,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("tenant_session_settings")
    .upsert(payload, { onConflict: "tenant_id" })
    .select()
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    settings: {
      ...DEFAULT_SESSION_SETTINGS,
      ...(data?.[0] || payload),
    },
  })
}
