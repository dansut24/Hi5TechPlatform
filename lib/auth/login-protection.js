import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 10
const LOCKOUT_MINUTES = 15

export async function getTenantBySlugForAuth(slug) {
  if (!slug) return null

  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .limit(1)

  if (error) {
    console.error("[login-protection] tenant lookup failed", error)
    return null
  }

  return data?.[0] || null
}

export async function recordLoginAttempt({
  tenantId,
  email,
  success,
  reason = null,
  ip = null,
  userAgent = null,
}) {
  if (!tenantId || !email) return

  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from("login_attempts")
    .insert({
      tenant_id: tenantId,
      email: String(email).trim().toLowerCase(),
      success: Boolean(success),
      reason,
      ip_address: ip,
      user_agent: userAgent,
    })

  if (error) {
    console.error("[login-protection] failed to record login attempt", error)
  }
}

export async function checkLoginLockout({ tenantId, email }) {
  if (!tenantId || !email) {
    return { locked: false, remainingSeconds: 0 }
  }

  const supabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("login_attempts")
    .select("success, created_at")
    .eq("tenant_id", tenantId)
    .eq("email", String(email).trim().toLowerCase())
    .gte("created_at", since)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[login-protection] failed to check lockout", error)
    return { locked: false, remainingSeconds: 0 }
  }

  const failures = (data || []).filter((item) => !item.success)

  if (failures.length < MAX_ATTEMPTS) {
    return { locked: false, remainingSeconds: 0 }
  }

  const latestFailure = failures[0]
  const latestFailureTime = new Date(latestFailure.created_at).getTime()
  const unlockAt = latestFailureTime + LOCKOUT_MINUTES * 60 * 1000
  const remainingMs = unlockAt - Date.now()

  if (remainingMs > 0) {
    return {
      locked: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    }
  }

  return { locked: false, remainingSeconds: 0 }
}
