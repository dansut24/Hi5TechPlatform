import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndMember(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  if (membershipError || !memberships?.[0]) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user }
}

export async function GET(_req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (incidentError || !incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      *,
      profiles:actor_user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("tenant_id", tenant.id)
    .eq("entity_type", "incident")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ activity: data || [] })
}
