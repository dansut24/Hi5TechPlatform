import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"
import { themeMap } from "@/lib/themes"

export default async function CreateWorkspacePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const context = await getCurrentTenantContext()

  if (!context.user) {
    redirect("/login")
  }

  if (context.tenants.length > 0) {
    redirect("/select-tenant")
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Create your workspace</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Your account is ready. Next we’ll create your tenant, assign your modules, and get you into the platform.
          </div>

          <div className="mt-8 grid gap-4">
            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-sm font-medium">Next step</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                We’ll wire this form next so you can choose workspace name, plan, branding, and default modules.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
