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
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ incident: data })
}

export async function PATCH(req, { params }) {
  const { slug, id } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const body = await req.json()

  const updates = {}

  if ("status" in body) {
    updates.status = String(body.status || "").trim()
  }

  if ("priority" in body) {
    updates.priority = String(body.priority || "").trim()
  }

  if ("assigned_to" in body) {
    updates.assigned_to = body.assigned_to || null
  }

  if ("assignment_group_id" in body) {
    updates.assignment_group_id = body.assignment_group_id || null
  }

  if ("resolution_notes" in body) {
    updates.resolution_notes = String(body.resolution_notes || "").trim() || null
  }

  if (updates.status) {
    const { data: statusRow, error: statusError } = await supabase
      .from("incident_statuses")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("key", updates.status)
      .single()

    if (statusError || !statusRow) {
      return NextResponse.json({ error: "Invalid incident status" }, { status: 400 })
    }

    if (statusRow.is_resolved && !updates.resolved_at) {
      updates.resolved_at = new Date().toISOString()
    }

    if (!statusRow.is_resolved) {
      updates.resolved_at = null
    }

    if (statusRow.is_closed && !updates.closed_at) {
      updates.closed_at = new Date().toISOString()
    }

    if (!statusRow.is_closed) {
      updates.closed_at = null
    }
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ incident: data })
}
