import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"
import { themeMap } from "@/lib/themes"
import CreateWorkspacePage from "@/components/onboarding/create-workspace-page"

export default async function CreateWorkspaceRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const context = await getCurrentTenantContext()

  if (!context.user) {
    redirect("/login")
  }

  if (context.tenants.length > 0) {
    redirect("/select-tenant")
  }

  return <CreateWorkspacePage theme={theme} profile={context.profile} />
}
