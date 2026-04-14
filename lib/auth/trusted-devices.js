import crypto from "crypto"
import { cookies, headers } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const TRUSTED_DEVICE_COOKIE = "hi5_trusted_device"

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function safeString(value, fallback = null) {
  const text = String(value || "").trim()
  return text ? text : fallback
}

function parseUserAgent(ua) {
  const userAgent = String(ua || "")

  let browser = "Unknown browser"
  if (/Edg\//i.test(userAgent)) browser = "Edge"
  else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) browser = "Chrome"
  else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) browser = "Safari"
  else if (/Firefox\//i.test(userAgent)) browser = "Firefox"

  let os = "Unknown OS"
  if (/Windows/i.test(userAgent)) os = "Windows"
  else if (/Mac OS X/i.test(userAgent)) os = "macOS"
  else if (/iPhone|iPad|iOS/i.test(userAgent)) os = "iOS"
  else if (/Android/i.test(userAgent)) os = "Android"
  else if (/Linux/i.test(userAgent)) os = "Linux"

  return { browser, os, userAgent }
}

export async function getTrustedDeviceCookieValue() {
  const cookieStore = await cookies()
  return cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value || null
}

export async function setTrustedDeviceCookie(token, expiresAt) {
  const cookieStore = await cookies()

  cookieStore.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  })
}

export async function clearTrustedDeviceCookie() {
  const cookieStore = await cookies()
  cookieStore.set(TRUSTED_DEVICE_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })
}

export async function createTrustedDevice({
  tenantId,
  userId,
  deviceName = null,
  rememberDeviceDays = 30,
}) {
  if (!tenantId || !userId) return null

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = sha256(token)

  const headerStore = await headers()
  const { browser, os, userAgent } = parseUserAgent(headerStore.get("user-agent"))

  const expiresAt = new Date(Date.now() + rememberDeviceDays * 24 * 60 * 60 * 1000).toISOString()

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("trusted_devices")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      token_hash: tokenHash,
      device_name: safeString(deviceName, `${browser} on ${os}`),
      browser,
      os,
      user_agent: userAgent,
      expires_at: expiresAt,
      last_seen_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[trusted-devices] create failed", error)
    return null
  }

  await setTrustedDeviceCookie(token, expiresAt)

  return data
}

export async function getActiveTrustedDevice({ tenantId, userId }) {
  if (!tenantId || !userId) return null

  const token = await getTrustedDeviceCookieValue()
  if (!token) return null

  const tokenHash = sha256(token)
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("trusted_devices")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)

  if (error) {
    console.error("[trusted-devices] lookup failed", error)
    return null
  }

  return data?.[0] || null
}

export async function touchTrustedDevice(deviceId) {
  if (!deviceId) return

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("trusted_devices")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", deviceId)

  if (error) {
    console.error("[trusted-devices] touch failed", error)
  }
}

export async function revokeTrustedDevice({ tenantId, userId, deviceId }) {
  if (!tenantId || !userId || !deviceId) return false

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("trusted_devices")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("id", deviceId)

  if (error) {
    console.error("[trusted-devices] revoke failed", error)
    return false
  }

  return true
}

export async function revokeAllTrustedDevices({ tenantId, userId }) {
  if (!tenantId || !userId) return false

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from("trusted_devices")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("revoked_at", null)

  if (error) {
    console.error("[trusted-devices] revoke all failed", error)
    return false
  }

  await clearTrustedDeviceCookie()
  return true
}
