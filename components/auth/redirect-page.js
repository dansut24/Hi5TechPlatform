"use client"

import { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function initialsFromPath(pathname) {
  const clean = pathname.replace(/^\/+/, "") || "select-module"
  const parts = clean.split("/").filter(Boolean)
  if (parts.length === 0) return "H"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "H"
}

export default function RedirectPage({ theme }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/select-module"

  const initials = useMemo(() => initialsFromPath(next), [next])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(next)
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [router, next])

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
        <div className="mx-auto flex w-full max-w-[220px] flex-col items-center">
          <div className="relative">
            <div className={theme.resolved === "light"
              ? "h-24 w-24 rounded-full border border-slate-300/70 bg-white/80"
              : "h-24 w-24 rounded-full border border-white/10 bg-white/5"} />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-300" />
            <div className="absolute inset-2 flex items-center justify-center rounded-full border text-xl font-semibold">
              {initials}
            </div>
          </div>

          <div className="mt-6 text-2xl font-semibold">Loading workspace</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Preparing your modules and redirecting you now.
          </div>
        </div>
      </div>
    </div>
  )
}
