import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

async function getTenantAndAdmin(slug) {
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
    .select("role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null
  const role = String(membership?.role || "").toLowerCase()

  if (membershipError || !membership || membership.status !== "active" || !["owner", "admin"].includes(role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { tenant }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { tenant } = ctx
  const adminSupabase = createAdminSupabaseClient()

  const [loginAttemptsRes, authActivityRes] = await Promise.all([
    adminSupabase
      .from("login_attempts")
      .select("id, email, success, reason, ip_address, user_agent, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(50),

    adminSupabase
      .from("activity_log")
      .select("id, actor_user_id, entity_type, entity_id, event_type, message, metadata, created_at")
      .eq("tenant_id", tenant.id)
      .eq("entity_type", "auth")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  if (loginAttemptsRes.error) {
    return NextResponse.json({ error: loginAttemptsRes.error.message }, { status: 500 })
  }

  if (authActivityRes.error) {
    return NextResponse.json({ error: authActivityRes.error.message }, { status: 500 })
  }

  const loginAttempts = loginAttemptsRes.data || []
  const authActivity = authActivityRes.data || []

  const cutoff = Date.now() - 10 * 60 * 1000
  const failuresByEmail = new Map()

  for (const item of loginAttempts) {
    const createdAt = new Date(item.created_at).getTime()
    if (!item.success && createdAt >= cutoff) {
      const key = String(item.email || "").toLowerCase()
      failuresByEmail.set(key, (failuresByEmail.get(key) || 0) + 1)
    }
  }

  const lockouts = Array.from(failuresByEmail.entries())
    .filter(([, count]) => count >= 5)
    .map(([email, count]) => ({ email, count }))

  const summary = {
    totalAttempts: loginAttempts.length,
    failedAttempts: loginAttempts.filter((item) => !item.success).length,
    successfulAttempts: loginAttempts.filter((item) => item.success).length,
    activeLockouts: lockouts.length,
  }

  return NextResponse.json({
    summary,
    lockouts,
    loginAttempts,
    authActivity,
  })
}
