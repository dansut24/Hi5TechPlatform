import { themeMap } from "@/lib/themes"

export default async function TenantLoginPage({ params }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const { slug } = await params

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-lg rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Tenant login</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Your workspace is ready. Next we’ll wire this into the tenant-specific authentication and password setup flow.
          </div>

          <div className={`mt-6 rounded-[24px] border p-5 ${theme.card}`}>
            <div className="text-sm font-medium">Tenant</div>
            <div className="mt-2 text-lg font-semibold">{slug}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
