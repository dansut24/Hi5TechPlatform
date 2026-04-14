import { redirect } from "next/navigation"
import { getTenantBranding } from "@/lib/tenant/branding"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import Tenant2faVerifyPage from "@/components/auth/tenant-2fa-verify-page"

export default async function TenantVerify2faPage({ params }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    redirect(`/tenant/${slug}/login`)
  }

  const branding = getTenantBranding(tenant)

  const theme = {
    app: "bg-slate-950 text-white",
    card: "border-white/10 bg-white/5 text-white",
    input: "border-white/10 bg-white/5 text-white placeholder:text-slate-500",
    muted: "text-slate-300",
  }

  return (
    <Tenant2faVerifyPage
      tenant={tenant}
      branding={branding}
      theme={theme}
    />
  )
}
