import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { sendMail } from "@/lib/email/smtp"
import { buildTenantInviteEmail } from "@/lib/email/invite-email"

export async function GET(_request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: members, error: membersError } = await access.admin
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
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: true })

    if (membersError) throw membersError

    const { data: invites, error: invitesError } = await access.admin
      .from("tenant_invites")
      .select("*")
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: false })

    if (invitesError) throw invitesError

    const { data: groups, error: groupsError } = await access.admin
      .from("groups")
      .select("id, name")
      .eq("tenant_id", access.tenant.id)
      .order("name", { ascending: true })

    if (groupsError) throw groupsError

    return NextResponse.json({
      ok: true,
      members: members || [],
      invites: invites || [],
      groups: groups || [],
      tenant: access.tenant,
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
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const email = body.email?.trim()?.toLowerCase()
    const role = body.role?.trim() || "technician"
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds : []

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existingInvite } = await access.admin
      .from("tenant_invites")
      .select("id")
      .eq("tenant_id", access.tenant.id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: "A pending invite already exists for this email" }, { status: 400 })
    }

    const { data: inviterProfile } = await access.admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", access.user.id)
      .maybeSingle()

    const { data: invite, error: inviteError } = await access.admin
      .from("tenant_invites")
      .insert({
        tenant_id: access.tenant.id,
        email,
        role,
        invite_token: token,
        invited_by: access.user.id,
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
      tenantName: access.tenant.name,
      tenantSlug: access.tenant.slug,
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
