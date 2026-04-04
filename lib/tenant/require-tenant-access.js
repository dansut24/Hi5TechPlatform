import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"

export async function requireTenantAccess(slug) {
  const context = await getCurrentTenantContext()

  if (!context.user) {
    redirect(`/tenant/${slug}/login`)
  }

  const tenant = context.tenants.find((t) => t.slug === slug)

  if (!tenant) {
    redirect("/select-tenant")
  }

  return {
    context,
    tenant,
  }
}
