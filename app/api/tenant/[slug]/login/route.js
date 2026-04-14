import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import {
  recordLoginAttempt,
  checkLoginLockout,
} from "@/lib/auth/login-protection"

import { logActivity } from "@/lib/activity/log-activity"

async function getTenant(supabase, slug) {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .limit(1)

  return {
    tenant: data?.[0] || null,
    error,
  }
}

export async function POST(req, { params }) {
  const { slug } = params
  const supabase = await createServerSupabaseClient()

  try {
    const body = await req.json()

    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const rememberDevice = Boolean(body.rememberDevice)
    const deviceName = String(body.deviceName || "").trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // ------------------------------------
    // Resolve tenant
    // ------------------------------------
    const { tenant, error: tenantError } = await getTenant(supabase, slug)

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      )
    }

    // ------------------------------------
    // 🔐 LOCKOUT CHECK
    // ------------------------------------
    const lock = await checkLoginLockout({
      tenantId: tenant.id,
      email,
    })

    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${lock.remainingSeconds}s.`,
        },
        { status: 429 }
      )
    }

    // ------------------------------------
    // Authenticate user
    // ------------------------------------
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError || !authData?.user) {
      await recordLoginAttempt({
        tenantId: tenant.id,
        email,
        success: false,
        reason: "invalid_credentials",
        ip: req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent"),
      })

      await logActivity({
        tenantId: tenant.id,
        actorUserId: null,
        entityType: "auth",
        entityId: email,
        eventType: "login_failed",
        message: `Failed login attempt for ${email}`,
      })

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = authData.user

    // ------------------------------------
    // Validate tenant membership
    // ------------------------------------
    const { data: memberships } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .limit(1)

    const membership = memberships?.[0] || null

    if (!membership || membership.status !== "active") {
      await recordLoginAttempt({
        tenantId: tenant.id,
        email,
        success: false,
        reason: "no_membership",
      })

      return NextResponse.json(
        { error: "Access denied for this tenant" },
        { status: 403 }
      )
    }

    // ------------------------------------
    // Load profile
    // ------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    // ------------------------------------
    // Check 2FA requirement
    // ------------------------------------
    if (profile?.two_factor_enabled) {
      return NextResponse.json({
        requires2FA: true,
        redirectTo: `/tenant/${tenant.slug}/login/verify-2fa`,
      })
    }

    // ------------------------------------
    // Trusted device (optional)
    // ------------------------------------
    if (rememberDevice) {
      try {
        await supabase.from("trusted_devices").insert({
          tenant_id: tenant.id,
          user_id: user.id,
          name: deviceName || "Unnamed device",
        })
      } catch (e) {
        console.error("[trusted-device] failed", e)
      }
    }

    // ------------------------------------
    // SUCCESS LOGGING
    // ------------------------------------
    await recordLoginAttempt({
      tenantId: tenant.id,
      email,
      success: true,
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    })

    await logActivity({
      tenantId: tenant.id,
      actorUserId: user.id,
      entityType: "auth",
      entityId: user.id,
      eventType: "login_success",
      message: "User logged in",
    })

    // ------------------------------------
    // Redirect
    // ------------------------------------
    return NextResponse.json({
      success: true,
      redirectTo: `/tenant/${tenant.slug}/dashboard`,
    })
  } catch (err) {
    console.error("[login] unexpected error", err)

    return NextResponse.json(
      { error: "Unexpected error during login" },
      { status: 500 }
    )
  }
}
