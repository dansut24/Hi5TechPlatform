import AppShell from "@/components/app-shell"
import { getTenantBranding } from "@/lib/tenant/branding"
import { getTenantModuleAccess } from "@/lib/tenant/module-access"

export default async function TenantDashboardPage({ params }) {
  const { slug } = params
  const access = await getTenantModuleAccess(slug)

  if (!access.user) {
    return null
  }

  const branding = getTenantBranding(access.tenant)

  return (
    <AppShell
      initialView="modules"
      tenantSlug={slug}
      tenantName={access.tenant?.name || slug}
      branding={branding}
      tenantData={access.tenant}
      allowedModuleIds={access.allowedModuleIds}
    />
  )
}
