"use client"

import { useState } from "react"

export default function Tenant2faVerifyPage({ theme, tenant, branding }) {
  const [code, setCode] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenant.slug}/login/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          useRecoveryCode
            ? { recoveryCode }
            : { code }
        ),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Unable to verify code")
      }

      window.location.href = json.redirectTo || `/tenant/${tenant.slug}/dashboard`
    } catch (err) {
      setError(err.message || "Unable to verify code")
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
          <div className="text-3xl font-semibold">
            {branding?.loginHeading || "Verify sign in"}
          </div>
          <div className={`mt-1 text-sm ${theme.muted}`}>
            Enter your authenticator code to continue to {tenant.name}.
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setUseRecoveryCode(false)}
              className={`rounded-2xl px-4 py-2 text-sm ${!useRecoveryCode ? "text-white" : ""}`}
              style={{
                background: !useRecoveryCode ? branding?.brandHex || "#38bdf8" : "transparent",
              }}
            >
              Authenticator code
            </button>
            <button
              onClick={() => setUseRecoveryCode(true)}
              className={`rounded-2xl px-4 py-2 text-sm ${useRecoveryCode ? "text-white" : ""}`}
              style={{
                background: useRecoveryCode ? branding?.brandHex || "#38bdf8" : "transparent",
              }}
            >
              Recovery code
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {!useRecoveryCode ? (
              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Authenticator code</div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit()
                  }}
                />
              </div>
            ) : (
              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Recovery code</div>
                <input
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="AB12CD34"
                  autoComplete="one-time-code"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit()
                  }}
                />
              </div>
            )}

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white disabled:opacity-60"
              style={{
                background: branding?.brandHex || "#38bdf8",
              }}
            >
              {loading ? "Verifying..." : "Verify and continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
