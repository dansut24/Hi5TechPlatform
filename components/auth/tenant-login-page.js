"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

function initialsFromName(name, slug) {
  const source = name?.trim() || slug?.trim() || "Tenant"
  const parts = source.split(/\s+/).filter(Boolean)
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "T"
  )
}

function getSafeNext(next, fallback) {
  if (!next) return fallback
  if (!next.startsWith("/")) return fallback
  if (next.startsWith("//")) return fallback
  return next
}

export default function TenantLoginPage({ theme, tenant, branding, ready = false }) {
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberDevice, setRememberDevice] = useState(false)
  const [deviceName, setDeviceName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fallbackPath = `/tenant/${tenant.slug}/dashboard`
  const next = getSafeNext(searchParams.get("next"), fallbackPath)

  const submit = async () => {
    try {
      setError("")

      const trimmedEmail = email.trim()
      const trimmedDeviceName = deviceName.trim()

      if (!trimmedEmail || !password) {
        setError("Please enter your email and password")
        return
      }

      setLoading(true)

      const res = await fetch(`/api/tenant/${tenant.slug}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          rememberDevice,
          deviceName: trimmedDeviceName || null,
          moduleId: "selfservice",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Unable to sign in")
      }

      if (json.requiresStepUp && json.redirectTo) {
        window.location.href = json.redirectTo
        return
      }

      window.location.href = getSafeNext(next, json.redirectTo || fallbackPath)
    } catch (err) {
      setError(err.message || "Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div
        className="flex min-h-screen items-center justify-center px-5 py-10"
        style={{
          background:
            "radial-gradient(circle at top, rgba(var(--tenant-brand-rgb),0.18), transparent 32%)",
        }}
      >
        <div className={`w-full max-w-lg rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="flex items-center gap-4">
            {branding?.logoUrl ? (
              <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border ${theme.card}`}>
                <img
                  src={branding.logoUrl}
                  alt={`${tenant.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-semibold ${theme.card}`}
                style={{
                  boxShadow: "0 0 0 1px rgba(var(--tenant-brand-rgb),0.2), 0 0 24px rgba(var(--tenant-brand-rgb),0.16)",
                }}
              >
                {initialsFromName(tenant.name, tenant.slug)}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-3xl font-semibold">
                {branding?.loginHeading || "Tenant login"}
              </div>
              <div className={`mt-1 text-sm ${theme.muted}`}>
                {branding?.loginMessage || `Sign in to continue to ${tenant.name}.`}
              </div>
            </div>
          </div>

          {ready ? (
            <div
              className="mt-6 rounded-[24px] border p-4 text-sm"
              style={{
                borderColor: "rgba(var(--tenant-brand-rgb),0.25)",
                background: "rgba(var(--tenant-brand-rgb),0.10)",
                color: "rgb(var(--tenant-brand-rgb))",
              }}
            >
              Your account is ready. Sign in to continue to your tenant workspace.
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <div>
              <div className={`mb-2 text-sm ${theme.muted}`}>Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                placeholder="owner@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className={`mb-2 text-sm ${theme.muted}`}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit()
                }}
              />
            </div>

            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${theme.card}`}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Remember this device</span>
            </label>

            {rememberDevice ? (
              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Device name (optional)</div>
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="Dan's iPhone"
                  autoComplete="off"
                />
              </div>
            ) : null}

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white disabled:opacity-60"
              style={{
                background: branding?.brandHex || "#38bdf8",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className={`mt-6 rounded-[24px] border p-5 ${theme.card}`}>
            <div className="text-sm font-medium">Tenant URL</div>
            <div className="mt-2 text-lg font-semibold">{tenant.slug}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
