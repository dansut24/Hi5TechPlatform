import { Suspense } from "react"
import TrialCheckEmailPage from "@/components/trial/trial-check-email-page"
import { themeMap } from "@/lib/themes"

function Fallback({ theme }) {
  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-lg font-semibold">Loading…</div>
        </div>
      </div>
    </div>
  )
}

export default function TrialCheckEmailRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }

  return (
    <Suspense fallback={<Fallback theme={theme} />}>
      <TrialCheckEmailPage theme={theme} />
    </Suspense>
  )
}
