import AppShell from "@/components/app-shell"
import { requireTenantAccess } from "@/lib/tenant/require-tenant-access"

export default async function TenantAnalyticsPage({ params }) {
  const { slug } = await params
  await requireTenantAccess(slug)

  return <AppShell initialView="app" forcedModule="analytics" tenantSlug={slug} />
}
