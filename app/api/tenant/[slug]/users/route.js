import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendMail } from "@/lib/email/smtp"
import { buildTenantInviteEmail } from "@/lib/email/invite-email"

async function requireTenantAdmin(slug) {
  const supabase = await createSupabaseServerClient()
  const admin = getSupabaseAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return { error: "Not authenticated", status: 401 }

  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("role, tenant_id")
    .eq("user_id", user.id)
    .eq("tenants.slug", slug)
    .select("role, tenant_id, tenants!inner(slug)")
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: "Forbidden", status: 403 }
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single()

  if (tenantError) throw tenantError

  return { user, tenant, admin }
}

export async function GET(_request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantAdmin(slug)
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { tenant, admin } = access

    const { data: members, error: membersError } = await admin
      .from("memberships")
      .select(`
        id,
        role,
        status,
        user_id,
        created_at,
        profiles:user_id (
          id,
          email,
          full_name,
          initials
        )
      `)
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true })

    if (membersError) throw membersError

    const { data: invites, error: invitesError } = await admin
      .from("tenant_invites")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })

    if (invitesError) throw invitesError

    const { data: groups, error: groupsError } = await admin
      .from("groups")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true })

    if (groupsError) throw groupsError

    return NextResponse.json({
      ok: true,
      members: members || [],
      invites: invites || [],
      groups: groups || [],
      tenant,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load tenant users" },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantAdmin(slug)
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { tenant, admin, user } = access
    const body = await request.json()

    const email = body.email?.trim()?.toLowerCase()
    const role = body.role?.trim() || "technician"
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds : []

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existingInvite } = await admin
      .from("tenant_invites")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: "A pending invite already exists for this email" }, { status: 400 })
    }

    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle()

    const { data: invite, error: inviteError } = await admin
      .from("tenant_invites")
      .insert({
        tenant_id: tenant.id,
        email,
        role,
        invite_token: token,
        invited_by: user.id,
        group_ids: groupIds,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("*")
      .single()

    if (inviteError) throw inviteError

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
    const inviteUrl = `${siteUrl}/invite/${token}`

    const mail = buildTenantInviteEmail({
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      inviteUrl,
      invitedByName: inviterProfile?.full_name || inviterProfile?.email || "An administrator",
      role,
      expiresAt,
    })

    await sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    return NextResponse.json({ ok: true, invite })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    )
  }
}
