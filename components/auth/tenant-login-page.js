"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signInWithPassword } from "@/lib/supabase/auth"

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

export default function TenantLoginPage({ theme, tenant, ready = false }) {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fallbackPath = `/tenant/${tenant.slug}/dashboard`
  const next = getSafeNext(searchParams.get("next"), fallbackPath)

  const submit = async () => {
    try {
      setError("")

      const trimmedEmail = email.trim()
      if (!trimmedEmail || !password) {
        setError("Please enter your email and password")
        return
      }

      setLoading(true)

      await signInWithPassword({
        email: trimmedEmail,
        password,
      })

      window.location.href = next
    } catch (err) {
      setError(err.message || "Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-lg rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="flex items-center gap-4">
            {tenant.logo_url ? (
              <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border ${theme.card}`}>
                <img
                  src={tenant.logo_url}
                  alt={`${tenant.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-semibold ${theme.card}`}>
                {initialsFromName(tenant.name, tenant.slug)}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-3xl font-semibold">Tenant login</div>
              <div className={`mt-1 text-sm ${theme.muted}`}>
                Sign in to continue to <span className="font-medium">{tenant.name}</span>.
              </div>
            </div>
          </div>

          {ready ? (
            <div className="mt-6 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
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

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}

            <button
              onClick={submit}
              disabled={loading}
              className={
                theme.resolved === "light"
                  ? "w-full rounded-2xl bg-slate-950 px-4 py-3 text-white disabled:opacity-60"
                  : "w-full rounded-2xl bg-white px-4 py-3 text-slate-950 disabled:opacity-60"
              }
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
