"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  signInWithGitHub,
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabase/auth"
import { GitHubMark, GoogleMark, MicrosoftMark, SSOMark } from "@/components/shared-ui"

export default function LoginPage({ theme }) {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/select-module"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authMode, setAuthMode] = useState("signin")

  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/redirect?next=${encodeURIComponent(next)}`
    : undefined

  const handlePasswordAuth = async () => {
    try {
      setAuthError("")
      const trimmedEmail = email.trim()

      if (!trimmedEmail || !password) {
        setAuthError("Please enter your email and password")
        return
      }

      setAuthLoading(true)

      if (authMode === "signin") {
        await signInWithPassword({ email: trimmedEmail, password })
        window.location.href = `/redirect?next=${encodeURIComponent(next)}`
        return
      }

      const result = await signUpWithPassword({ email: trimmedEmail, password })

      if (result?.user && !result?.session) {
        setAuthError("Account created. Check your email to confirm your address before signing in.")
      } else {
        window.location.href = `/redirect?next=${encodeURIComponent(next)}`
      }
    } catch (error) {
      setAuthError(error.message || "Unable to continue")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    try {
      setAuthLoading(true)
      setAuthError("")

      if (provider === "google") {
        await signInWithGoogle(redirectTo)
      } else if (provider === "microsoft") {
        await signInWithMicrosoft(redirectTo)
      } else if (provider === "github") {
        await signInWithGitHub(redirectTo)
      }
    } catch (error) {
      setAuthError(error.message || "Unable to sign in")
      setAuthLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className={`rounded-[28px] border shadow-2xl backdrop-blur-2xl overflow-hidden ${theme.card}`}>
          <div className="relative h-full min-h-[360px] overflow-hidden p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${theme.card}`}>
                  <span className="text-lg font-semibold">H</span>
                </div>
                <div>
                  <div className={`text-sm ${theme.muted}`}>Enterprise Workspace</div>
                  <div className="text-xl font-semibold tracking-tight">Hi5Tech Platform</div>
                </div>
              </div>

              <div className="mt-12 max-w-xl">
                <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${theme.card} ${theme.muted}`}>
                  Unified operations
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">
                  Run service, support, devices, and self-service from one platform.
                </h1>
                <p className={`mt-4 text-base lg:text-lg ${theme.muted}`}>
                  A modern multi-module workspace for ITSM, RMM, asset management, automation, analytics, and end-user support.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-[28px] border shadow-2xl backdrop-blur-2xl p-6 lg:p-8 ${theme.card}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold">
                {authMode === "signin" ? "Sign in" : "Create account"}
              </div>
              <div className={`mt-1 text-sm ${theme.muted}`}>
                {authMode === "signin"
                  ? "Access your tenant workspace and launch the right module."
                  : "Create your account to start using the workspace."}
              </div>
            </div>

            <button
              onClick={() => {
                setAuthError("")
                setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))
              }}
              className={`rounded-2xl border px-3 py-2 text-sm transition ${theme.card} ${theme.hover}`}
            >
              {authMode === "signin" ? "Create account" : "Back to sign in"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
              placeholder="dan@hi5tech.co.uk"
              autoComplete="email"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
              placeholder="••••••••••••"
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
            />

            {authError ? <div className="text-sm text-rose-400">{authError}</div> : null}

            <button
              onClick={handlePasswordAuth}
              disabled={authLoading}
              className={
                theme.resolved === "light"
                  ? "w-full rounded-2xl bg-slate-950 px-4 py-3 text-white disabled:opacity-60"
                  : "w-full rounded-2xl bg-white px-4 py-3 text-slate-950 disabled:opacity-60"
              }
            >
              {authLoading
                ? authMode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : authMode === "signin"
                  ? "Sign in to workspace"
                  : "Create account"}
            </button>

            <div className={`relative py-2 ${theme.muted}`}>
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${theme.line}`} />
              </div>
              <div className="relative flex justify-center">
                <span className={`px-3 text-xs uppercase tracking-wide ${theme.resolved === "light" ? "bg-white text-slate-500" : "bg-[#0b0d12] text-slate-500"}`}>
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleOAuthLogin("microsoft")}
                className={`flex h-12 items-center justify-center gap-3 rounded-2xl border px-4 text-sm transition ${theme.card} ${theme.hover}`}
              >
                <MicrosoftMark className="h-5 w-5" />
                <span>Microsoft 365</span>
              </button>

              <button
                onClick={() => handleOAuthLogin("google")}
                className={`flex h-12 items-center justify-center gap-3 rounded-2xl border px-4 text-sm transition ${theme.card} ${theme.hover}`}
              >
                <GoogleMark className="h-5 w-5" />
                <span>Google</span>
              </button>

              <button
                onClick={() => handleOAuthLogin("github")}
                className={`flex h-12 items-center justify-center gap-3 rounded-2xl border px-4 text-sm transition ${theme.card} ${theme.hover}`}
              >
                <GitHubMark className="h-5 w-5" />
                <span>GitHub</span>
              </button>

              <button
                type="button"
                className={`flex h-12 items-center justify-center gap-3 rounded-2xl border px-4 text-sm transition ${theme.card} ${theme.hover}`}
              >
                <SSOMark className="h-5 w-5" />
                <span>SAML SSO</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
