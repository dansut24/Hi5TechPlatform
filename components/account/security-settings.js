"use client"

import { useEffect, useState } from "react"
import { KeyRound, Laptop, Shield, Smartphone, Trash2 } from "lucide-react"
import { cn } from "@/components/shared-ui"

function Card({ theme, children, className = "" }) {
  return (
    <div className={cn("rounded-[28px] border p-5 shadow-2xl backdrop-blur-2xl", theme.card, className)}>
      {children}
    </div>
  )
}

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function DeviceIcon({ os }) {
  const value = String(os || "").toLowerCase()

  if (value.includes("ios") || value.includes("android")) {
    return <Smartphone className="h-5 w-5" />
  }

  return <Laptop className="h-5 w-5" />
}

export default function SecuritySettings({ tenantSlug, theme, tenantName }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState("")
  const [revokingAll, setRevokingAll] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [recoveryCodeCount, setRecoveryCodeCount] = useState(0)
  const [twoFactorLoading, setTwoFactorLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [verifying2fa, setVerifying2fa] = useState(false)
  const [disabling2fa, setDisabling2fa] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [manualSecret, setManualSecret] = useState("")
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState([])

  async function loadDevices() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/security/trusted-devices`, {
        cache: "no-store",
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to load trusted devices")

      setDevices(json.devices || [])
    } catch (err) {
      setError(err.message || "Failed to load trusted devices")
    } finally {
      setLoading(false)
    }
  }

  async function load2faStatus() {
    try {
      setTwoFactorLoading(true)

      const res = await fetch(`/api/tenant/${tenantSlug}/security/2fa/status`, {
        cache: "no-store",
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to load 2FA status")

      setTwoFactorEnabled(Boolean(json.enabled))
      setRecoveryCodeCount(Number(json.recoveryCodeCount || 0))
    } catch (err) {
      setError(err.message || "Failed to load 2FA status")
    } finally {
      setTwoFactorLoading(false)
    }
  }

  useEffect(() => {
    if (tenantSlug) {
      loadDevices()
      load2faStatus()
    }
  }, [tenantSlug])

  async function revokeDevice(deviceId) {
    try {
      setRevokingId(deviceId)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/security/trusted-devices`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to revoke device")

      setMessage("Trusted device revoked.")
      await loadDevices()
    } catch (err) {
      setError(err.message || "Failed to revoke device")
    } finally {
      setRevokingId("")
    }
  }

  async function revokeAllDevices() {
    try {
      setRevokingAll(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/security/trusted-devices`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ revokeAll: true }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to revoke all devices")

      setMessage("All trusted devices revoked.")
      await loadDevices()
    } catch (err) {
      setError(err.message || "Failed to revoke all devices")
    } finally {
      setRevokingAll(false)
    }
  }

  async function start2faEnrollment() {
    try {
      setEnrolling(true)
      setError("")
      setMessage("")
      setGeneratedRecoveryCodes([])

      const res = await fetch(`/api/tenant/${tenantSlug}/security/2fa/enroll`, {
        method: "POST",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to start 2FA setup")

      setQrDataUrl(json.qrDataUrl || "")
      setManualSecret(json.secret || "")
      setShowEnrollment(true)
    } catch (err) {
      setError(err.message || "Failed to start 2FA setup")
    } finally {
      setEnrolling(false)
    }
  }

  async function verifyAndEnable2fa() {
    try {
      setVerifying2fa(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/security/2fa/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to enable 2FA")

      setGeneratedRecoveryCodes(json.recoveryCodes || [])
      setShowEnrollment(false)
      setVerificationCode("")
      setMessage("Two-factor authentication is now enabled.")
      await load2faStatus()
    } catch (err) {
      setError(err.message || "Failed to enable 2FA")
    } finally {
      setVerifying2fa(false)
    }
  }

  async function disable2fa() {
    try {
      setDisabling2fa(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/security/2fa/disable`, {
        method: "POST",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to disable 2FA")

      setTwoFactorEnabled(false)
      setRecoveryCodeCount(0)
      setShowEnrollment(false)
      setGeneratedRecoveryCodes([])
      setQrDataUrl("")
      setManualSecret("")
      setVerificationCode("")
      setMessage("Two-factor authentication has been disabled.")
      await load2faStatus()
    } catch (err) {
      setError(err.message || "Failed to disable 2FA")
    } finally {
      setDisabling2fa(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", theme.card)}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Account security</h1>
                <p className={cn("mt-1 text-sm", theme.muted)}>
                  Manage remembered devices and two-factor authentication for {tenantName || tenantSlug}.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={revokeAllDevices}
            disabled={revokingAll || devices.length === 0}
            className="rounded-2xl border border-rose-400/20 px-4 py-2.5 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
          >
            {revokingAll ? "Revoking..." : "Revoke all devices"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <Card theme={theme}>
            <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <KeyRound className="h-5 w-5" />
              Two-factor authentication
            </div>

            {twoFactorLoading ? (
              <div className="text-sm">Loading 2FA status...</div>
            ) : (
              <>
                <div className={cn("text-sm leading-6", theme.muted)}>
                  Protect your account with an authenticator app. Trusted devices can skip repeated
                  prompts later when your tenant policy allows it.
                </div>

                <div className={cn("mt-4 rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
                  <div className="font-medium">
                    Status: {twoFactorEnabled ? "Enabled" : "Not enabled"}
                  </div>
                  <div className={cn("mt-2", theme.muted)}>
                    Recovery codes available: {recoveryCodeCount}
                  </div>
                </div>

                {!twoFactorEnabled ? (
                  <button
                    onClick={start2faEnrollment}
                    disabled={enrolling}
                    className="mt-4 rounded-2xl px-4 py-2.5 text-sm text-white disabled:opacity-60"
                    style={{ background: "#38bdf8" }}
                  >
                    {enrolling ? "Starting..." : "Set up 2FA"}
                  </button>
                ) : (
                  <button
                    onClick={disable2fa}
                    disabled={disabling2fa}
                    className="mt-4 rounded-2xl border border-rose-400/20 px-4 py-2.5 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    {disabling2fa ? "Disabling..." : "Disable 2FA"}
                  </button>
                )}
              </>
            )}
          </Card>

          <Card theme={theme}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-lg font-semibold">Your remembered devices</div>
              <button
                onClick={loadDevices}
                className={cn("rounded-2xl border px-4 py-2 text-sm transition", theme.card, theme.hover)}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-sm">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
                No trusted devices yet.
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  const revoked = Boolean(device.revoked_at)
                  const expired =
                    device.expires_at && new Date(device.expires_at).getTime() < Date.now()

                  return (
                    <div
                      key={device.id}
                      className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={cn("mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border", theme.card)}>
                            <DeviceIcon os={device.os} />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {device.device_name || `${device.browser || "Browser"} on ${device.os || "Device"}`}
                            </div>
                            <div className={cn("mt-1 text-xs", theme.muted)}>
                              {device.browser || "Unknown browser"} • {device.os || "Unknown OS"}
                            </div>
                            <div className={cn("mt-2 text-xs", theme.muted)}>
                              Last seen: {formatDate(device.last_seen_at)}
                            </div>
                            <div className={cn("mt-1 text-xs", theme.muted)}>
                              Expires: {formatDate(device.expires_at)}
                            </div>

                            {revoked ? (
                              <div className="mt-2 text-xs text-rose-300">Revoked</div>
                            ) : null}
                            {!revoked && expired ? (
                              <div className="mt-2 text-xs text-amber-300">Expired</div>
                            ) : null}
                          </div>
                        </div>

                        {!revoked ? (
                          <button
                            onClick={() => revokeDevice(device.id)}
                            disabled={revokingId === device.id}
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-rose-400/20 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {revokingId === device.id ? "Revoking..." : "Revoke"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {showEnrollment ? (
          <Card theme={theme} className="mt-6">
            <div className="text-lg font-semibold">Finish 2FA setup</div>
            <div className={cn("mt-2 text-sm", theme.muted)}>
              Scan this QR code with your authenticator app, then enter the 6-digit code to enable 2FA.
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[280px,1fr]">
              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="2FA QR code" className="w-full rounded-xl bg-white p-3" />
                ) : (
                  <div className="text-sm">Generating QR code...</div>
                )}
              </div>

              <div>
                <div className={cn("mb-2 text-sm", theme.muted)}>Manual setup key</div>
                <div className={cn("rounded-2xl border p-4 text-sm break-all", theme.subCard, theme.line)}>
                  {manualSecret || "—"}
                </div>

                <div className={cn("mt-4 mb-2 text-sm", theme.muted)}>Verification code</div>
                <input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                  placeholder="123456"
                />

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={verifyAndEnable2fa}
                    disabled={verifying2fa}
                    className="rounded-2xl px-4 py-2.5 text-sm text-white disabled:opacity-60"
                    style={{ background: "#38bdf8" }}
                  >
                    {verifying2fa ? "Verifying..." : "Enable 2FA"}
                  </button>

                  <button
                    onClick={() => {
                      setShowEnrollment(false)
                      setVerificationCode("")
                      setQrDataUrl("")
                      setManualSecret("")
                    }}
                    className={cn("rounded-2xl border px-4 py-2.5 text-sm transition", theme.card, theme.hover)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {generatedRecoveryCodes.length > 0 ? (
          <Card theme={theme} className="mt-6">
            <div className="text-lg font-semibold">Recovery codes</div>
            <div className={cn("mt-2 text-sm", theme.muted)}>
              Save these now. Each recovery code can only be used once.
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {generatedRecoveryCodes.map((code) => (
                <div
                  key={code}
                  className={cn("rounded-2xl border p-3 text-sm font-medium tracking-wide", theme.subCard, theme.line)}
                >
                  {code}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
