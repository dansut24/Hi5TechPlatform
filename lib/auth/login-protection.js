import { createServerSupabaseClient } from "@/lib/supabase/server"

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 10
const LOCKOUT_MINUTES = 15

export async function recordLoginAttempt({
  tenantId,
  email,
  success,
  reason = null,
  ip = null,
  userAgent = null,
}) {
  const supabase = await createServerSupabaseClient()

  await supabase.from("login_attempts").insert({
    tenant_id: tenantId,
    email: email.toLowerCase(),
    success,
    reason,
    ip_address: ip,
    user_agent: userAgent,
  })
}

export async function checkLoginLockout({ tenantId, email }) {
  const supabase = await createServerSupabaseClient()

  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("login_attempts")
    .select("success, created_at")
    .eq("tenant_id", tenantId)
    .eq("email", email.toLowerCase())
    .gte("created_at", since)
    .order("created_at", { ascending: false })

  if (error) return { locked: false }

  const failures = data.filter((a) => !a.success)

  if (failures.length < MAX_ATTEMPTS) {
    return { locked: false }
  }

  const lastFailure = new Date(failures[0].created_at)
  const unlockTime = new Date(lastFailure.getTime() + LOCKOUT_MINUTES * 60000)

  if (Date.now() < unlockTime.getTime()) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((unlockTime.getTime() - Date.now()) / 1000),
    }
  }

  return { locked: false }
}
