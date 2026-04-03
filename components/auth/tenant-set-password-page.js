"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function TenantSetPasswordPage({ theme, slug }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error("Supabase client not available")

        const code = searchParams.get("code")
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        const { data, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (mounted) {
          setReady(!!data.user)
          if (!data.user) {
            setError("Your setup session is not ready. Please reopen the email link.")
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to initialize password setup")
        }
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [searchParams])

  const submit = async () => {
    try {
      setError("")

      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      const supabase = getSupabaseClient()
      if (!supabase) throw new Error("Supabase client not available")

      setLoading(true)

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      await supabase.auth.signOut()
      router.replace(`/tenant/${slug}/login?ready=1`)
    } catch (err) {
      setError(err.message || "Failed to set password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-lg rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Set your password</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Finish setting up your superuser account for <span className="font-medium">{slug}</span>.
          </div>

          <div className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
              placeholder="New password"
              autoComplete="new-password"
              disabled={!ready || loading}
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
              placeholder="Confirm password"
              autoComplete="new-password"
              disabled={!ready || loading}
            />

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}

            <button
              onClick={submit}
              disabled={!ready || loading}
              className={
                theme.resolved === "light"
                  ? "w-full rounded-2xl bg-slate-950 px-4 py-3 text-white disabled:opacity-60"
                  : "w-full rounded-2xl bg-white px-4 py-3 text-slate-950 disabled:opacity-60"
              }
            >
              {loading ? "Setting password..." : "Set password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
