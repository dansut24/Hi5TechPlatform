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

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx

  const baseQuery = supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  const [allRes, unassignedRes, myRes, resolvedRes] = await Promise.all([
    baseQuery,
    supabase
      .from("incidents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .is("assigned_to", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("incidents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("incidents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false }),
  ])

  if (allRes.error) return NextResponse.json({ error: allRes.error.message }, { status: 500 })
  if (unassignedRes.error) return NextResponse.json({ error: unassignedRes.error.message }, { status: 500 })
  if (myRes.error) return NextResponse.json({ error: myRes.error.message }, { status: 500 })
  if (resolvedRes.error) return NextResponse.json({ error: resolvedRes.error.message }, { status: 500 })

  return NextResponse.json({
    queues: {
      all: allRes.data || [],
      unassigned: unassignedRes.data || [],
      mine: myRes.data || [],
      resolved: resolvedRes.data || [],
    },
  })
}
