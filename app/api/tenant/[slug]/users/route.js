import crypto from "crypto"
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendMail } from "@/lib/email/smtp"
import { buildTenantInviteEmail } from "@/lib/email/invite-email"

const ROLE_OPTIONS = ["owner", "admin", "technician", "user"]
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value) {
  return UUID_RE.test(String(value || ""))
}

function getBaseUrl(request) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""

  if (envUrl) {
    try {
      return new URL(envUrl).toString().replace(/\/$/, "")
    } catch {}
  }

  const origin = request.headers.get("origin")
  if (origin) {
    try {
      return new URL(origin).toString().replace(/\/$/, "")
    } catch {}
  }

  try {
    return request.nextUrl.origin.replace(/\/$/, "")
  } catch {
    return ""
  }
}

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
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0] || null

  if (
    membershipError ||
    !membership ||
    !["owner", "admin"].includes(String(membership.role || "").toLowerCase())
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { supabase, tenant, user, membership }
}

export async function GET(_req, { params }) {
  const { slug } = params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant } = ctx

  const [membersRes, invitesRes, groupsRes] = await Promise.all([
    supabase
      .from("memberships")
      .select(`
        user_id,
        role,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("tenant_invites")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("groups")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
  ])

  if (membersRes.error) {
    return NextResponse.json({ error: membersRes.error.message }, { status: 500 })
  }

  if (invitesRes.error) {
    return NextResponse.json({ error: invitesRes.error.message }, { status: 500 })
  }

  if (groupsRes.error) {
    return NextResponse.json({ error: groupsRes.error.message }, { status: 500 })
  }

  const members = (membersRes.data || []).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] || null : row.profiles || null,
  }))

  return NextResponse.json({
    members,
    invites: invitesRes.data || [],
    groups: groupsRes.data || [],
  })
}

export async function POST(request, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndAdmin(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx

  try {
    const body = await request.json()

    const email = String(body.email || "").trim().toLowerCase()
    const role = String(body.role || "user").trim().toLowerCase()

    const rawGroupIds = Array.isArray(body.groupIds) ? body.groupIds : []
    const cleanGroupIds = rawGroupIds
      .map((id) => String(id || "").trim())
      .filter((id) => id.length > 0 && isUuid(id))

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    if (!ROLE_OPTIONS.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (cleanGroupIds.length > 0) {
      const { data: validGroups, error: groupsError } = await supabase
        .from("groups")
        .select("id")
        .eq("tenant_id", tenant.id)
        .in("id", cleanGroupIds)

      if (groupsError) {
        return NextResponse.json({ error: groupsError.message }, { status: 500 })
      }

      const validGroupIds = new Set((validGroups || []).map((group) => group.id))
      const invalidGroups = cleanGroupIds.filter((id) => !validGroupIds.has(id))

      if (invalidGroups.length > 0) {
        return NextResponse.json({ error: "One or more selected groups are invalid" }, { status: 400 })
      }
    }

    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existingInvite } = await supabase
      .from("tenant_invites")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle()

    let invite = null

    if (existingInvite?.id) {
      const { data, error } = await supabase
        .from("tenant_invites")
        .update({
          role,
          invited_by: user.id,
          group_ids: cleanGroupIds,
          expires_at: expiresAt,
          invite_token: inviteToken,
          status: "pending",
          revoked_at: null,
        })
        .eq("id", existingInvite.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      invite = data
    } else {
      const { data, error } = await supabase
        .from("tenant_invites")
        .insert({
          tenant_id: tenant.id,
          email,
          role,
          status: "pending",
          invite_token: inviteToken,
          invited_by: user.id,
          group_ids: cleanGroupIds,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      invite = data
    }

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle()

    const baseUrl = getBaseUrl(request)
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Could not determine site URL for invite email" },
        { status: 500 }
      )
    }

    const inviteUrl = `${baseUrl}/invite/${invite.invite_token}`

    const mail = buildTenantInviteEmail({
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      inviteUrl,
      invitedByName: inviterProfile?.full_name || inviterProfile?.email || "An administrator",
      role: invite.role,
      expiresAt,
    })

    await sendMail({
      to: invite.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    return NextResponse.json({ invite })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to invite user" },
      { status: 500 }
    )
  }
}
