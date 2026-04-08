import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndUser(slug) {
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
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user, membership }
}

export async function GET(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data: categories, error: categoriesError } = await supabase
    .from("service_catalog_categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (categoriesError) {
    return NextResponse.json({ error: categoriesError.message }, { status: 500 })
  }

  const { data: items, error: itemsError } = await supabase
    .from("service_catalog_items")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({
    categories: categories || [],
    items: items || [],
  })
}
