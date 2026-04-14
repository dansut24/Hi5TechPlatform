import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTenantBranding } from "@/lib/tenant/branding"
import SecurityDashboardPanel from "@/components/admin/security-dashboard-panel"

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
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null
  const role = String(membership?.role || "").toLowerCase()

  if (!membership || !["owner", "admin"].includes(role)) return null

  return { tenant }
}

export default async function TenantSecurityPage({ params }) {
  const { slug } = params
  const ctx = await getTenantContext(slug)

  if (!ctx?.tenant) {
    redirect(`/tenant/${slug}/login`)
  }

  const branding = getTenantBranding(ctx.tenant)

  const theme = {
    app: "bg-slate-950 text-white",
    card: "border-white/10 bg-white/5 text-white",
    subCard: "bg-white/5",
    line: "border-white/10",
    muted: "text-slate-300",
    hover: "hover:bg-white/10",
    input: "border-white/10 bg-white/5 text-white placeholder:text-slate-500",
  }

  return (
    <div style={branding?.cssVars || {}} className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <SecurityDashboardPanel tenantSlug={slug} theme={theme} />
      </div>
    </div>
  )
}
