import { notFound } from "next/navigation"
import { themeMap } from "@/lib/themes"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import TenantLoginPage from "@/components/auth/tenant-login-page"

export default async function TenantLoginRoutePage({ params, searchParams }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const admin = getSupabaseAdminClient()
  const { slug } = await params
  const ready = (await searchParams)?.ready === "1"

  const { data: tenant, error } = await admin
    .from("tenants")
    .select("id, name, slug, status, plan, logo_url")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !tenant) {
    notFound()
  }

  return <TenantLoginPage theme={theme} tenant={tenant} ready={ready} />
}
