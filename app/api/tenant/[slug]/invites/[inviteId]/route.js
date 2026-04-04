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
    .select("role, tenant_id, tenants!inner(slug)")
    .eq("user_id", user.id)
    .eq("tenants.slug", slug)
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

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle()

  return { user, tenant, admin, inviterProfile }
}

export async function POST(request, { params }) {
  try {
    const { slug, inviteId } = await params
    const access = await requireTenantAdmin(slug)
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { tenant, admin, inviterProfile } = access
    const body = await request.json()
    const action = body.action

    const { data: invite, error: inviteError } = await admin
      .from("tenant_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("tenant_id", tenant.id)
      .single()

    if (inviteError) throw inviteError

    if (action === "revoke") {
      const { error } = await admin
        .from("tenant_invites")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("id", invite.id)

      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === "resend") {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await admin
        .from("tenant_invites")
        .update({
          expires_at: expiresAt,
          status: "pending",
        })
        .eq("id", invite.id)

      if (error) throw error

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
      const inviteUrl = `${siteUrl}/invite/${invite.invite_token}`

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

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update invite" },
      { status: 500 }
    )
  }
}
