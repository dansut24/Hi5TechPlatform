import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

function getSiteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
}

export async function GET(request, context) {
  try {
    const admin = getSupabaseAdminClient()
    const { token } = await context.params
    const siteUrl = getSiteUrl(request)

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

    const redirectTo = `${siteUrl}/tenant/${signup.tenant_slug}/set-password?signup=${signup.id}`

    let actionLink = null
    let authUserId = signup.created_user_id || null

    if (!authUserId) {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "invite",
        email: signup.superuser_email,
        options: {
          redirectTo,
          data: {
            full_name: signup.full_name,
            tenant_slug: signup.tenant_slug,
            company_name: signup.company_name,
            trial_signup_id: signup.id,
          },
        },
      })

      if (error) throw error

      authUserId = data?.user?.id || null
      actionLink = data?.properties?.action_link || null

      if (!authUserId || !actionLink) {
        throw new Error("Failed to generate invite link")
      }

      const { error: updateError } = await admin
        .from("trial_signups")
        .update({
          created_user_id: authUserId,
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", signup.id)

      if (updateError) throw updateError

      return NextResponse.redirect(actionLink)
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: signup.superuser_email,
      options: {
        redirectTo,
      },
    })

    if (error) throw error

    actionLink = data?.properties?.action_link || null

    if (!actionLink) {
      throw new Error("Failed to regenerate password setup link")
    }

    const { error: updateError } = await admin
      .from("trial_signups")
      .update({
        status: "verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", signup.id)

    if (updateError) throw updateError

    return NextResponse.redirect(actionLink)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to complete setup" },
      { status: 500 }
    )
  }
}
