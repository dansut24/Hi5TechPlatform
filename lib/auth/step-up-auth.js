import crypto from "crypto"
import { cookies } from "next/headers"
import { authenticator } from "otplib"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveTrustedDevice } from "@/lib/auth/trusted-devices"

const STEP_UP_COOKIE = "hi5_step_up"

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex")
}

export async function getUserSecuritySettings(userId) {
  if (!userId) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("user_security_settings")
    .select("*")
    .eq("user_id", userId)
    .limit(1)

  if (error) {
    console.error("[step-up] failed to load user security settings", error)
    return null
  }

  return data?.[0] || null
}

export async function getTenantSessionSettings(tenantId) {
  if (!tenantId) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("tenant_session_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .limit(1)

  if (error) {
    console.error("[step-up] failed to load tenant session settings", error)
    return null
  }

  return data?.[0] || null
}

export async function getMembershipRole({ tenantId, userId }) {
  if (!tenantId || !userId) return null

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(1)

  if (error) {
    console.error("[step-up] failed to load membership role", error)
    return null
  }

  return data?.[0]?.role || null
}

export async function shouldRequireStepUp({
  tenantId,
  userId,
  moduleId,
}) {
  if (!tenantId || !userId) return false

  const [tenantSettings, userSecurity, role] = await Promise.all([
    getTenantSessionSettings(tenantId),
    getUserSecuritySettings(userId),
    getMembershipRole({ tenantId, userId }),
  ])

  const trustedDevice = await getActiveTrustedDevice({ tenantId, userId })

  if (trustedDevice) {
    return false
  }

  const normalizedRole = String(role || "").toLowerCase()
  const totpEnabled = Boolean(userSecurity?.totp_enabled)

  if (!totpEnabled) {
    return false
  }

  if (moduleId === "admin" && tenantSettings?.require_2fa_for_admin) {
    return true
  }

  if (moduleId === "control" && tenantSettings?.require_2fa_for_control) {
    return true
  }

  if (["owner", "admin"].includes(normalizedRole)) {
    return true
  }

  return false
}

export async function issueStepUpChallenge({
  tenantSlug,
  tenantId,
  userId,
  email,
  redirectTo,
  rememberDevice,
  deviceName,
}) {
  const payload = {
    tenantSlug,
    tenantId,
    userId,
    email,
    redirectTo,
    rememberDevice: Boolean(rememberDevice),
    deviceName: deviceName || null,
    issuedAt: Date.now(),
  }

  const raw = JSON.stringify(payload)
  const cookieStore = await cookies()

  cookieStore.set(STEP_UP_COOKIE, raw, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  })

  return payload
}

export async function getStepUpChallenge() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(STEP_UP_COOKIE)?.value || null
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.userId || !parsed?.tenantId) return null
    return parsed
  } catch {
    return null
  }
}

export async function clearStepUpChallenge() {
  const cookieStore = await cookies()
  cookieStore.set(STEP_UP_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })
}

export async function verifyTotpCode({ userId, code }) {
  if (!userId || !code) return false

  const settings = await getUserSecuritySettings(userId)
  if (!settings?.totp_enabled || !settings?.totp_secret) return false

  try {
    return authenticator.verify({
      token: String(code || "").trim(),
      secret: settings.totp_secret,
    })
  } catch {
    return false
  }
}

export async function consumeRecoveryCode({ userId, code }) {
  if (!userId || !code) return false

  const supabase = await createServerSupabaseClient()
  const settings = await getUserSecuritySettings(userId)
  if (!settings) return false

  const normalized = hashValue(String(code || "").trim())
  const currentCodes = Array.isArray(settings.recovery_codes) ? settings.recovery_codes : []

  if (!currentCodes.includes(normalized)) {
    return false
  }

  const nextCodes = currentCodes.filter((item) => item !== normalized)

  const { error } = await supabase
    .from("user_security_settings")
    .update({
      recovery_codes: nextCodes,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    console.error("[step-up] failed to consume recovery code", error)
    return false
  }

  return true
}

export function generateRecoveryCodes() {
  const plainCodes = Array.from({ length: 8 }).map(() =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  )

  return {
    plainCodes,
    hashedCodes: plainCodes.map((code) => hashValue(code)),
  }
}
