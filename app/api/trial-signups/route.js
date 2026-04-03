import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
}

export async function POST(request) {
  try {
    const admin = getSupabaseAdminClient()
    const body = await request.json()

    const fullName = body.fullName?.trim()
    const companyName = body.companyName?.trim()
    const tenantName = body.tenantName?.trim()
    const tenantSlug = slugify(body.tenantSlug || body.tenantName || "")
    const superuserEmail = body.superuserEmail?.trim().toLowerCase()

    if (!fullName || !companyName || !tenantName || !tenantSlug || !superuserEmail) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const { data: existingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .maybeSingle()

    if (existingTenant) {
      return NextResponse.json({ error: "That tenant slug is already in use" }, { status: 400 })
    }

    const token = generateToken()
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: signup, error } = await admin
      .from("trial_signups")
      .insert({
        full_name: fullName,
        company_name: companyName,
        tenant_name: tenantName,
        tenant_slug: tenantSlug,
        superuser_email: superuserEmail,
        signup_token: token,
        token_expires_at: tokenExpiresAt,
        status: "pending",
      })
      .select("id, tenant_slug, superuser_email, signup_token, token_expires_at")
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      signup,
      next: `/trial/check-email?email=${encodeURIComponent(superuserEmail)}`,
      setupUrl: `/setup/${token}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create trial signup" },
      { status: 500 }
    )
  }
}
