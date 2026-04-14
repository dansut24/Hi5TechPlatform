import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { logActivity } from "@/lib/activity/log-activity"

async function getTenantAndAdmin(slug) {
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
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null
  const role = String(membership?.role || "").toLowerCase()

  if (membershipError || !membership || membership.status !== "active" || !["owner", "admin"].includes(role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { tenant, user }
}

export async function POST(req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { tenant, user } = ctx
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || "").trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const adminSupabase = createAdminSupabaseClient()
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { error } = await adminSupabase
    .from("login_attempts")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("email", email)
    .eq("success", false)
    .gte("created_at", since)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    tenantId: tenant.id,
    actorUserId: user.id,
    entityType: "auth",
    entityId: email,
    eventType: "login_unlock_admin",
    message: `Admin unlocked login for ${email}`,
    metadata: {
      unlocked_email: email,
    },
  })

  return NextResponse.json({ success: true })
}
