import { Suspense } from "react"
import RedirectPage from "@/components/auth/redirect-page"
import { themeMap } from "@/lib/themes"

function RedirectFallback({ theme }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
        <div className="text-lg font-semibold">Loading workspace…</div>
      </div>
    </div>
  )
}

export default function RedirectRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }

  return (
    <Suspense fallback={<RedirectFallback theme={theme} />}>
      <RedirectPage theme={theme} />
    </Suspense>
  )
}
