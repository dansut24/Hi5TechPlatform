import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"
import { issueStepUpChallenge, shouldRequireStepUp } from "@/lib/auth/step-up-auth"

async function getSessionSettings(supabase, tenantId) {
  const { data } = await supabase
    .from("tenant_session_settings")
    .select("remember_device_days")
    .eq("tenant_id", tenantId)
    .limit(1)

  return data?.[0] || { remember_device_days: 30 }
}

export async function POST(req, { params }) {
  const { slug } = await params
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

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", userId)
    .limit(1)

  if (membershipError || !memberships?.[0]) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "You do not have access to this tenant" },
      { status: 403 }
    )
  }

  const redirectTo = `/tenant/${tenant.slug}/dashboard`
  const requireStepUp = await shouldRequireStepUp({
    tenantId: tenant.id,
    userId,
    moduleId: requestedModule,
  })

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
    const settings = await getSessionSettings(supabase, tenant.id)

    await createTrustedDevice({
      tenantId: tenant.id,
      userId,
      deviceName,
      rememberDeviceDays: Number(settings.remember_device_days || 30),
    })
  }

  return NextResponse.json({
    success: true,
    redirectTo,
  })
}
