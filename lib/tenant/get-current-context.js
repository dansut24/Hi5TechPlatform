import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getCurrentTenantContext() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return { user: null, profile: null, memberships: [], tenants: [], modules: [] }

  const [{ data: profile }, { data: memberships }, { data: modules }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("id, tenant_id, role, status, tenants(id, name, slug, status, plan, trial_ends_at)")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase.from("modules").select("*").eq("is_enabled", true),
  ])

  const tenantMemberships = memberships || []
  const tenants = tenantMemberships.map((m) => ({
    membershipId: m.id,
    tenantId: m.tenant_id,
    role: m.role,
    status: m.status,
    ...(m.tenants || {}),
  }))

  return {
    user,
    profile: profile || null,
    memberships: tenantMemberships,
    tenants,
    modules: modules || [],
  }
}
