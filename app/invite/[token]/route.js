import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U"
}

export async function GET(request, { params }) {
  try {
    const { token } = params
    const admin = getSupabaseAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

    const { data: invite, error: inviteError } = await admin
      .from("tenant_invites")
      .select(`
        *,
        tenants!inner (
          id,
          name,
          slug
        )
      `)
      .eq("invite_token", token)
      .maybeSingle()

    if (inviteError) throw inviteError
    if (!invite) {
      return NextResponse.redirect(new URL("/login?invite=invalid", siteUrl))
    }

    if (invite.status === "accepted") {
      return NextResponse.redirect(new URL(`/tenant/${invite.tenants.slug}/login?ready=1`, siteUrl))
    }

    if (invite.status === "revoked" || new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.redirect(new URL(`/tenant/${invite.tenants.slug}/login?invite=expired`, siteUrl))
    }

    const redirectTo = `${siteUrl}/tenant/${invite.tenants.slug}/set-password?invite=${invite.id}`

    let actionLink = null
    let createdUserId = invite.created_user_id || null

    try {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "invite",
        email: invite.email,
        options: {
          redirectTo,
          data: {
            tenant_slug: invite.tenants.slug,
            tenant_invite_id: invite.id,
            email: invite.email,
          },
        },
      })

      if (error) throw error

      createdUserId = data?.user?.id || createdUserId
      actionLink = data?.properties?.action_link || null

      if (createdUserId) {
        await admin
          .from("profiles")
          .upsert(
            {
              id: createdUserId,
              email: invite.email,
              full_name: invite.email,
              initials: initialsFromName(invite.email, invite.email),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )

        await admin
          .from("tenant_invites")
          .update({
            created_user_id: createdUserId,
          })
          .eq("id", invite.id)
      }
    } catch (error) {
      if (!String(error.message || "").includes("already been registered")) {
        throw error
      }

      const { data, error: recoveryError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: invite.email,
        options: {
          redirectTo,
        },
      })

      if (recoveryError) throw recoveryError
      actionLink = data?.properties?.action_link || null
    }

    if (!actionLink) {
      throw new Error("Failed to generate invite acceptance link")
    }

    return NextResponse.redirect(actionLink)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to accept invite" },
      { status: 500 }
    )
  }
}
