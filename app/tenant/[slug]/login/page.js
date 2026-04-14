import { notFound } from "next/navigation"
import { themeMap } from "@/lib/themes"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getTenantBranding } from "@/lib/tenant/branding"
import TenantBrandShell from "@/components/tenant-brand-shell"
import TenantLoginPage from "@/components/auth/tenant-login-page"

export default async function TenantLoginRoutePage({ params, searchParams }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const admin = getSupabaseAdminClient()
  const { slug } = params
  const ready = (await searchParams)?.ready === "1"

  const { data: tenant, error } = await admin
    .from("tenants")
    .select("id, name, slug, status, plan, logo_url, brand_hex, brand_dark_hex, login_heading, login_message")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !tenant) {
    notFound()
  }

  const branding = getTenantBranding(tenant)

  return (
    <TenantBrandShell branding={branding}>
      <TenantLoginPage theme={theme} tenant={tenant} branding={branding} ready={ready} />
    </TenantBrandShell>
  )
}
