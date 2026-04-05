import AppShell from "@/components/app-shell"
import { getTenantBranding } from "@/lib/tenant/branding"
import { requireTenantModuleAccess } from "@/lib/tenant/module-access"

export default async function TenantSelfServicePage({ params }) {
  const { slug } = await params
  const access = await requireTenantModuleAccess(slug, "selfservice")
  const branding = getTenantBranding(access.tenant)

  return (
    <AppShell
      initialView="app"
      forcedModule="selfservice"
      tenantSlug={slug}
      tenantName={access.tenant?.name || slug}
      branding={branding}
      tenantData={access.tenant}
      allowedModuleIds={access.allowedModuleIds}
    />
  )
}
