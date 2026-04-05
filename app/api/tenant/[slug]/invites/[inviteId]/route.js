import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"
import { sendMail } from "@/lib/email/smtp"
import { buildTenantInviteEmail } from "@/lib/email/invite-email"

export async function POST(request, { params }) {
  try {
    const { slug, inviteId } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const action = body.action

    const { data: invite, error: inviteError } = await access.admin
      .from("tenant_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("tenant_id", access.tenant.id)
      .single()

    if (inviteError) throw inviteError

    if (action === "revoke") {
      const { error } = await access.admin
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

      const { error } = await access.admin
        .from("tenant_invites")
        .update({
          expires_at: expiresAt,
          status: "pending",
        })
        .eq("id", invite.id)

      if (error) throw error

      const { data: inviterProfile } = await access.admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", access.user.id)
        .maybeSingle()

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
      const inviteUrl = `${siteUrl}/invite/${invite.invite_token}`

      const mail = buildTenantInviteEmail({
        tenantName: access.tenant.name,
        tenantSlug: access.tenant.slug,
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
