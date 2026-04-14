import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  clearPendingTotpEnrollment,
  generateRecoveryCodes,
  getPendingTotpEnrollment,
  verifyTokenWithSecret,
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

  if (membershipError || !memberships?.[0]) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, user }
}

export async function POST(req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const { supabase, user } = ctx
  const body = await req.json()
  const code = String(body.code || "").trim()

  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
  }

  const pending = await getPendingTotpEnrollment(user.id)
  if (!pending?.secret) {
    return NextResponse.json({ error: "2FA setup session expired. Start again." }, { status: 400 })
  }

  const valid = verifyTokenWithSecret({
    token: code,
    secret: pending.secret,
  })

  if (!valid) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
  }

  const { plainCodes, hashedCodes } = generateRecoveryCodes()

  const { error } = await supabase
    .from("user_security_settings")
    .upsert(
      {
        user_id: user.id,
        totp_enabled: true,
        totp_secret: pending.secret,
        recovery_codes: hashedCodes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await clearPendingTotpEnrollment(user.id)

  return NextResponse.json({
    success: true,
    recoveryCodes: plainCodes,
  })
}
