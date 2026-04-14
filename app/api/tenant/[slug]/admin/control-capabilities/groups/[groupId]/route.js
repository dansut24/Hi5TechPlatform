import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CONTROL_CAPABILITIES } from "@/lib/permissions/control"

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
    .select("id, slug")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user }
}

export async function GET(_req, { params }) {
  const { slug, groupId } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("group_control_capabilities")
    .select("capability")
    .eq("tenant_id", tenant.id)
    .eq("group_id", groupId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    capabilities: (data || []).map((row) => row.capability),
    available: CONTROL_CAPABILITIES,
  })
}

export async function PUT(req, { params }) {
  const { slug, groupId } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()
  const capabilities = Array.isArray(body.capabilities) ? body.capabilities : []

  const invalid = capabilities.filter((cap) => !CONTROL_CAPABILITIES.includes(cap))
  if (invalid.length) {
    return NextResponse.json(
      { error: `Invalid capabilities: ${invalid.join(", ")}` },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase
    .from("group_control_capabilities")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("group_id", groupId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (capabilities.length > 0) {
    const rows = capabilities.map((capability) => ({
      tenant_id: tenant.id,
      group_id: groupId,
      capability,
    }))

    const { error: insertError } = await supabase
      .from("group_control_capabilities")
      .insert(rows)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
