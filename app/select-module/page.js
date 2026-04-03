import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"

export default async function SelectModulePage() {
  const context = await getCurrentTenantContext()

  if (!context.user) {
    redirect("/login")
  }

  if (context.tenants.length === 0) {
    redirect("/create-workspace")
  }

  if (context.tenants.length === 1) {
    redirect(`/tenant/${context.tenants[0].slug}`)
  }

  redirect("/select-tenant")
}
