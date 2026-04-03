import { Suspense } from "react"
import LoginPage from "@/components/auth/login-page"
import { themeMap } from "@/lib/themes"

function LoginFallback({ theme }) {
  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-lg font-semibold">Loading sign-in…</div>
        </div>
      </div>
    </div>
  )
}

export default function LoginRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }

  return (
    <Suspense fallback={<LoginFallback theme={theme} />}>
      <LoginPage theme={theme} />
    </Suspense>
  )
}
