import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revokeAllTrustedDevices, revokeTrustedDevice } from "@/lib/auth/trusted-devices"

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
    .select("id, slug")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null

  if (membershipError || !membership) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx

  const { data, error } = await supabase
    .from("trusted_devices")
    .select("id, device_name, browser, os, last_seen_at, expires_at, created_at, revoked_at")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devices: data || [] })
}

export async function DELETE(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { tenant, user } = ctx
  const body = await req.json().catch(() => ({}))

  const deviceId = String(body.deviceId || "").trim()
  const revokeAll = Boolean(body.revokeAll)

  if (revokeAll) {
    const ok = await revokeAllTrustedDevices({
      tenantId: tenant.id,
      userId: user.id,
    })

    if (!ok) {
      return NextResponse.json({ error: "Failed to revoke devices" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required" }, { status: 400 })
  }

  const ok = await revokeTrustedDevice({
    tenantId: tenant.id,
    userId: user.id,
    deviceId,
  })

  if (!ok) {
    return NextResponse.json({ error: "Failed to revoke device" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
