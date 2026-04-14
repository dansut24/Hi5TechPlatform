import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserSecuritySettings } from "@/lib/auth/step-up-auth"

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

  return { user }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const settings = await getUserSecuritySettings(ctx.user.id)

  return NextResponse.json({
    enabled: Boolean(settings?.totp_enabled),
    recoveryCodeCount: Array.isArray(settings?.recovery_codes) ? settings.recovery_codes.length : 0,
  })
}
