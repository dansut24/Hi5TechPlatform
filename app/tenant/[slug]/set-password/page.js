import { Suspense } from "react"
import { themeMap } from "@/lib/themes"
import TenantSetPasswordPage from "@/components/auth/tenant-set-password-page"

function Fallback({ theme }) {
  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-md rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-lg font-semibold">Loading password setup…</div>
        </div>
      </div>
    </div>
  )
}

export default async function TenantSetPasswordRoutePage({ params }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const { slug } = await params

  return (
    <Suspense fallback={<Fallback theme={theme} />}>
      <TenantSetPasswordPage theme={theme} slug={slug} />
    </Suspense>
  )
}
