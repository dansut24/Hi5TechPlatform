import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"

async function getTenantBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (error || !data) return null
  return data
}

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

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const tenant = await getTenantBySlug(supabase, slug)
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData?.user) {
    return NextResponse.json({ error: authError?.message || "Invalid login" }, { status: 401 })
  }

  const userId = authData.user.id

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", userId)
    .limit(1)

  if (!memberships?.[0]) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: "You do not have access to this tenant" }, { status: 403 })
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
    redirectTo: `/tenant/${tenant.slug}/${"selfservice"}`,
  })
}
