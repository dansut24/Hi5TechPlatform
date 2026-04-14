import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

async function getTenantAndUser(slug) {
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
    .select("id")
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

  const membership = memberships?.[0] || null

  if (membershipError || !membership) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user }
}

export async function GET(req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const { searchParams } = new URL(req.url)
  const moduleId = String(searchParams.get("module") || "").trim()

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  if (moduleId) {
    query = query.eq("module_id", moduleId)
  }

  const { data: notifications, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length

  return NextResponse.json({
    notifications: notifications || [],
    unreadCount,
  })
}
