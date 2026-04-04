import AppShell from "@/components/app-shell"
import { requireTenantAccess } from "@/lib/tenant/require-tenant-access"
import { getTenantBranding } from "@/lib/tenant/branding"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export default async function TenantControlPage({ params }) {
  const { slug } = await params
  const { tenant } = await requireTenantAccess(slug)

  const admin = getSupabaseAdminClient()

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, brand_hex, brand_dark_hex, login_heading, login_message")
    .eq("slug", slug)
    .maybeSingle()

  const branding = getTenantBranding(tenantRow || tenant)

  return (
    <AppShell
      initialView="app"
      forcedModule="control"
      tenantSlug={slug}
      tenantName={tenantRow?.name || tenant?.name || slug}
      branding={branding}
    />
  )
}
