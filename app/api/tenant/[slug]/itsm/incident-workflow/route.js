import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndMember(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant }
}

export async function GET(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const [statusesRes, usersRes, groupsRes] = await Promise.all([
    supabase
      .from("incident_statuses")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("memberships")
      .select(`
        user_id,
        role,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq("tenant_id", tenant.id),

    supabase
      .from("groups")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
  ])

  if (statusesRes.error) {
    return NextResponse.json({ error: statusesRes.error.message }, { status: 500 })
  }

  if (usersRes.error) {
    return NextResponse.json({ error: usersRes.error.message }, { status: 500 })
  }

  if (groupsRes.error) {
    return NextResponse.json({ error: groupsRes.error.message }, { status: 500 })
  }

  const users = (usersRes.data || []).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    profile: Array.isArray(row.profiles) ? row.profiles[0] || null : row.profiles || null,
  }))

  return NextResponse.json({
    statuses: statusesRes.data || [],
    users,
    groups: groupsRes.data || [],
  })
}
