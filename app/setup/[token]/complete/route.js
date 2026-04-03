import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request, context) {
  try {
    const admin = getSupabaseAdminClient()
    const { token } = await context.params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

    const { data: signup, error: signupError } = await admin
      .from("trial_signups")
      .select("*")
      .eq("signup_token", token)
      .maybeSingle()

    if (signupError) throw signupError

    if (!signup) {
      return NextResponse.redirect(new URL("/trial/start", siteUrl))
    }

    if (new Date(signup.token_expires_at).getTime() < Date.now()) {
      await admin
        .from("trial_signups")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", signup.id)

      return NextResponse.redirect(new URL("/trial/start?expired=1", siteUrl))
    }

    if (signup.status === "completed") {
      return NextResponse.redirect(new URL(`/tenant/${signup.tenant_slug}/login`, siteUrl))
    }

    const inviteRedirectTo = `${siteUrl}/tenant/${signup.tenant_slug}/set-password?signup=${signup.id}`

    let inviteData = null

    if (!signup.created_user_id) {
      const result = await admin.auth.admin.generateLink({
        type: "invite",
        email: signup.superuser_email,
        options: {
          redirectTo: inviteRedirectTo,
          data: {
            full_name: signup.full_name,
            tenant_slug: signup.tenant_slug,
            company_name: signup.company_name,
            trial_signup_id: signup.id,
          },
        },
      })

      if (result.error) {
        throw result.error
      }

      inviteData = result.data

      const authUserId = inviteData?.user?.id
      const actionLink = inviteData?.properties?.action_link

      if (!authUserId || !actionLink) {
        throw new Error("Failed to generate owner invite link")
      }

      await admin
        .from("trial_signups")
        .update({
          created_user_id: authUserId,
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", signup.id)

      return NextResponse.redirect(actionLink)
    }

    const result = await admin.auth.admin.generateLink({
      type: "recovery",
      email: signup.superuser_email,
      options: {
        redirectTo: inviteRedirectTo,
      },
    })

    if (result.error) {
      throw result.error
    }

    inviteData = result.data

    const actionLink = inviteData?.properties?.action_link
    if (!actionLink) {
      throw new Error("Failed to regenerate setup link")
    }

    await admin
      .from("trial_signups")
      .update({
        status: "verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", signup.id)

    return NextResponse.redirect(actionLink)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to complete setup" },
      { status: 500 }
    )
  }
}
