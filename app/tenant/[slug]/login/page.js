import { themeMap } from "@/lib/themes"

export default async function TenantLoginPage({ params, searchParams }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const { slug } = await params
  const ready = (await searchParams)?.ready === "1"

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-lg rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Tenant login</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Sign in to continue to <span className="font-medium">{slug}</span>.
          </div>

          {ready ? (
            <div className="mt-6 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Password set successfully. You can now sign in to your tenant workspace.
            </div>
          ) : null}

          <div className={`mt-6 rounded-[24px] border p-5 ${theme.card}`}>
            <div className="text-sm font-medium">Tenant</div>
            <div className="mt-2 text-lg font-semibold">{slug}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
