import { requireTenantAccess } from "@/lib/tenant/require-tenant-access"
import BrandingSettings from "@/components/admin/branding-settings"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export default async function BrandingPage({ params }) {
  const { slug } = params

  await requireTenantAccess(slug)

  const admin = getSupabaseAdminClient()

  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  return (
    <BrandingSettings
      tenant={tenant}
      tenantSlug={slug}
    />
  )
}
