import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getTenantItsmSettingsByTenantId } from "@/lib/itsm/settings"
import { sendIncidentCreatedEmail } from "@/lib/itsm/notifications"

function makeIncidentNumber() {
  return `INC-${Date.now()}`
}

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

  return { supabase, tenant, membership, user }
}

export async function GET(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx
  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get("q") || "").trim()

  let query = supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  if (q) {
    query = query.or(`number.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ incidents: data || [] })
}

export async function POST(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const shortDescription = String(body.shortDescription || body.short_description || "").trim()
  const description = String(body.details || body.description || "").trim()
  const priority = String(body.priority || "medium").trim()

  if (!shortDescription) {
    return NextResponse.json({ error: "Short description is required" }, { status: 400 })
  }

  const itsmSettings = await getTenantItsmSettingsByTenantId(tenant.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle()

  const incidentPayload = {
    tenant_id: tenant.id,
    number: makeIncidentNumber(),
    short_description: shortDescription,
    description,
    priority,
    status: "new",
    created_by: user.id,
    assigned_to: null,
    assignment_group_id: itsmSettings.default_triage_group_id || null,
    submitted_by_email: profile?.email || user.email || null,
    submitted_by_name: profile?.full_name || user.email || "Requester",
  }

  const { data: incident, error } = await supabase
    .from("incidents")
    .insert(incidentPayload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    if (itsmSettings.send_requester_confirmation_emails) {
      await sendIncidentCreatedEmail({
        tenantName: tenant.name || tenant.slug,
        incident,
      })
    }
  } catch (emailError) {
    console.error("[itsm-email] incident created email failed", emailError)
  }

  return NextResponse.json({ incident })
}
