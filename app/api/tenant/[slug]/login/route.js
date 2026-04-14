import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"
import { issueStepUpChallenge } from "@/lib/auth/step-up-auth"
import {
  checkLoginLockout,
  getTenantBySlugForAuth,
  recordLoginAttempt,
} from "@/lib/auth/login-protection"
import { logActivity } from "@/lib/activity/log-activity"

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

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    null

  const userAgent = req.headers.get("user-agent") || null

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  const tenant = await getTenantBySlugForAuth(slug)

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    )
  }

  const lock = await checkLoginLockout({
    tenantId: tenant.id,
    email,
  })

  if (lock.locked) {
    await logActivity({
      tenantId: tenant.id,
      actorUserId: null,
      entityType: "auth",
      entityId: email,
      eventType: "login_locked",
      message: `Blocked login attempt for ${email} due to temporary lockout`,
      metadata: {
        email,
        remaining_seconds: lock.remainingSeconds,
      },
    })

    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${lock.remainingSeconds}s.`,
      },
      { status: 429 }
    )
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData?.user) {
    await recordLoginAttempt({
      tenantId: tenant.id,
      email,
      success: false,
      reason: "invalid_credentials",
      ip,
      userAgent,
    })

    await logActivity({
      tenantId: tenant.id,
      actorUserId: null,
      entityType: "auth",
      entityId: email,
      eventType: "login_failed",
      message: `Failed login attempt for ${email}`,
      metadata: {
        email,
        reason: "invalid_credentials",
      },
    })

    return NextResponse.json(
      { error: authError?.message || "Invalid login" },
      { status: 401 }
    )
  }

  const userId = authData.user.id
  const membership = await getMembershipWithClient(supabase, tenant.id, userId)

  if (!membership?.id || membership.status !== "active") {
    await recordLoginAttempt({
      tenantId: tenant.id,
      email,
      success: false,
      reason: "inactive_or_missing_membership",
      ip,
      userAgent,
    })

    await logActivity({
      tenantId: tenant.id,
      actorUserId: userId,
      entityType: "auth",
      entityId: userId,
      eventType: "login_denied",
      message: `Login denied for ${email} due to membership status`,
      metadata: {
        email,
        membership_status: membership?.status || null,
      },
    })

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

  await recordLoginAttempt({
    tenantId: tenant.id,
    email,
    success: true,
    reason: "login_success",
    ip,
    userAgent,
  })

  const requireStepUp = shouldRequireStepUpFromData({
    trustedDeviceActive,
    userSecurity,
    membership,
    tenantSettings,
    moduleId: requestedModule,
  })

  const redirectTo = `/tenant/${tenant.slug}/dashboard`

  if (requireStepUp) {
    await logActivity({
      tenantId: tenant.id,
      actorUserId: userId,
      entityType: "auth",
      entityId: userId,
      eventType: "login_step_up_required",
      message: "Step-up authentication required",
      metadata: {
        module_id: requestedModule,
        trusted_device_active: trustedDeviceActive,
      },
    })

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

    await logActivity({
      tenantId: tenant.id,
      actorUserId: userId,
      entityType: "auth",
      entityId: userId,
      eventType: "trusted_device_created",
      message: "Trusted device created at login",
      metadata: {
        device_name: deviceName,
      },
    })
  }

  await logActivity({
    tenantId: tenant.id,
    actorUserId: userId,
    entityType: "auth",
    entityId: userId,
    eventType: "login_success",
    message: "User logged in",
    metadata: {
      module_id: requestedModule,
      trusted_device_active: trustedDeviceActive,
    },
  })

  return NextResponse.json({
    success: true,
    redirectTo,
  })
}
