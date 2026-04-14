import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  buildOtpAuthUri,
  generateTotpSecret,
  getOrCreateUserSecuritySettings,
  savePendingTotpEnrollment,
} from "@/lib/auth/step-up-auth"

async function getTenantAndUser(slug) {
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
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  if (membershipError || !memberships?.[0]) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { tenant, user }
}

export async function POST(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const { tenant, user } = ctx
  const settings = await getOrCreateUserSecuritySettings(user.id)

  if (settings?.totp_enabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 })
  }

  const secret = generateTotpSecret()
  const otpauth = buildOtpAuthUri({
    email: user.email,
    tenantName: tenant.name || tenant.slug,
    secret,
  })

  const qrDataUrl = await QRCode.toDataURL(otpauth)

  await savePendingTotpEnrollment({
    userId: user.id,
    secret,
  })

  return NextResponse.json({
    secret,
    otpauth,
    qrDataUrl,
  })
}
