import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTenantBranding } from "@/lib/tenant/branding"
import SecuritySettings from "@/components/account/security-settings"

async function getTenantContext(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!tenant) return null

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  if (!memberships?.[0]) return null

  return { tenant }
}

export default async function TenantSecurityPage({ params }) {
  const { slug } = params
  const ctx = await getTenantContext(slug)

  if (!ctx?.tenant) {
    redirect(`/tenant/${slug}/login`)
  }

  const branding = getTenantBranding(ctx.tenant)

  return (
    <div
      style={branding?.cssVars || {}}
      className="min-h-screen"
    >
      <SecuritySettings
        tenantSlug={slug}
        tenantName={ctx.tenant.name || slug}
        theme={{
          app: "bg-slate-950 text-white",
          card: "border-white/10 bg-white/5 text-white",
          subCard: "bg-white/5",
          line: "border-white/10",
          muted: "text-slate-300",
          hover: "hover:bg-white/10",
        }}
      />
    </div>
  )
}
