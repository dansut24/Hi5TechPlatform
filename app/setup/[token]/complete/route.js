import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(_request, context) {
  try {
    const admin = getSupabaseAdminClient()
    const { token } = await context.params

    const { data: signup, error: signupError } = await admin
      .from("trial_signups")
      .select("*")
      .eq("signup_token", token)
      .maybeSingle()

    if (signupError) throw signupError

    if (!signup) {
      return NextResponse.redirect(new URL("/trial/start", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
    }

    if (signup.status === "completed") {
      return NextResponse.redirect(
        new URL(`/tenant/${signup.tenant_slug}/login`, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
      )
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name: signup.tenant_name,
        slug: signup.tenant_slug,
        status: "trial",
        plan: "trial",
        trial_ends_at: trialEndsAt,
      })
      .select("id, slug")
      .single()

    if (tenantError) throw tenantError

    await admin
      .from("trial_signups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        created_tenant_id: tenant.id,
      })
      .eq("id", signup.id)

    return NextResponse.redirect(
      new URL(`/tenant/${tenant.slug}/login`, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to complete setup" },
      { status: 500 }
    )
  }
}
