import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"
import { issueStepUpChallenge } from "@/lib/auth/step-up-auth"

async function getSessionSettings(supabase, tenantId) {
  const { data } = await supabase
    .from("tenant_session_settings")
    .select("remember_device_days, require_2fa_for_admin, require_2fa_for_control")
    .eq("tenant_id", tenantId)
    .limit(1)

  return (
    data?.[0] || {
      remember_device_days: 30,
      require_2fa_for_admin: false,
      require_2fa_for_control: false,
    }
  )
}

async function getUserSecuritySettingsWithClient(supabase, userId) {
  const { data } = await supabase
    .from("user_security_settings")
    .select("*")
    .eq("user_id", userId)
    .limit(1)

  return data?.[0] || null
}

async function getMembershipWithClient(supabase, tenantId, userId) {
  const { data } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(1)

  return data?.[0] || null
}

async function hasActiveTrustedDeviceWithClient(supabase, tenantId, userId) {
  const { data } = await supabase
    .from("trusted_devices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)

  return Boolean(data?.[0])
}

function shouldRequireStepUpFromData({
  trustedDeviceActive,
  userSecurity,
  membership,
  tenantSettings,
  moduleId,
}) {
  if (trustedDeviceActive) return false

  const totpEnabled = Boolean(userSecurity?.totp_enabled)
  if (!totpEnabled) return false

  const normalizedRole = String(membership?.role || "").toLowerCase()

  if (moduleId === "admin" && tenantSettings?.require_2fa_for_admin) {
    return true
  }

  if (moduleId === "control" && tenantSettings?.require_2fa_for_control) {
    return true
  }

  if (["owner", "admin"].includes(normalizedRole)) {
    return true
  }

  return true
}

export async function POST(req, { params }) {
  const { slug } = params
  const supabase = await createServerSupabaseClient()
  const body = await req.json()

  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const rememberDevice = Boolean(body.rememberDevice)
  const deviceName = String(body.deviceName || "").trim() || null
  const requestedModule = String(body.moduleId || "selfservice").trim().toLowerCase()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message || "Invalid login" },
      { status: 401 }
    )
  }

  const userId = authData.user.id

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    )
  }

  const membership = await getMembershipWithClient(supabase, tenant.id, userId)

  if (!membership?.id || membership.status !== "active") {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "You do not have access to this tenant" },
      { status: 403 }
    )
  }

  const [tenantSettings, userSecurity, trustedDeviceActive] = await Promise.all([
    getSessionSettings(supabase, tenant.id),
    getUserSecuritySettingsWithClient(supabase, userId),
    hasActiveTrustedDeviceWithClient(supabase, tenant.id, userId),
  ])

  const requireStepUp = shouldRequireStepUpFromData({
    trustedDeviceActive,
    userSecurity,
    membership,
    tenantSettings,
    moduleId: requestedModule,
  })

  const redirectTo = `/tenant/${tenant.slug}/dashboard`

  if (requireStepUp) {
    await issueStepUpChallenge({
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      userId,
      email,
      redirectTo,
      rememberDevice,
      deviceName,
    })

    return NextResponse.json({
      success: true,
      requiresStepUp: true,
      redirectTo: `/tenant/${tenant.slug}/login/verify-2fa`,
    })
  }

  if (rememberDevice) {
    await createTrustedDevice({
      tenantId: tenant.id,
      userId,
      deviceName,
      rememberDeviceDays: Number(tenantSettings?.remember_device_days || 30),
    })
  }

  return NextResponse.json({
    success: true,
    redirectTo,
  })
}
