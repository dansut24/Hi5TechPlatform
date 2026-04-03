export const runtime = "nodejs"
import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendMail } from "@/lib/email/smtp"

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

function buildTrialEmail({ fullName, companyName, tenantName, tenantSlug, setupUrl, expiresAt }) {
  const expiresText = new Date(expiresAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })

  return {
    subject: `Complete your Hi5Tech trial setup for ${companyName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0b0d12;color:#e5e7eb;padding:32px">
        <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px">
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em">Complete your tenant setup</div>
          <p style="margin-top:16px;color:#cbd5e1;font-size:15px;line-height:1.7">
            Hi ${fullName},
          </p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7">
            Your free trial request for <strong>${companyName}</strong> is ready. Click the button below to confirm your workspace and continue the superuser setup flow.
          </p>
          <div style="margin:28px 0">
            <a href="${setupUrl}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:14px 22px;border-radius:16px;font-weight:600">
              Complete tenant setup
            </a>
          </div>
          <div style="border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px 18px;margin-top:12px">
            <div style="font-size:13px;color:#94a3b8">Workspace</div>
            <div style="margin-top:6px;font-size:16px;font-weight:600">${tenantName}</div>
            <div style="margin-top:14px;font-size:13px;color:#94a3b8">Tenant URL</div>
            <div style="margin-top:6px;font-size:16px;font-weight:600">/tenant/${tenantSlug}</div>
            <div style="margin-top:14px;font-size:13px;color:#94a3b8">Link expires</div>
            <div style="margin-top:6px;font-size:15px;font-weight:600">${expiresText} UTC</div>
          </div>
          <p style="margin-top:24px;color:#94a3b8;font-size:13px;line-height:1.6">
            If the button does not work, copy and paste this URL into your browser:
          </p>
          <p style="word-break:break-all;color:#cbd5e1;font-size:13px">${setupUrl}</p>
        </div>
      </div>
    `,
    text: `Hi ${fullName},

Your free trial request for ${companyName} is ready.

Complete tenant setup:
${setupUrl}

Workspace: ${tenantName}
Tenant URL: /tenant/${tenantSlug}
Link expires: ${new Date(expiresAt).toISOString()}
`,
  }
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

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const setupUrl = `${origin}/setup/${token}`

    const email = buildTrialEmail({
      fullName,
      companyName,
      tenantName,
      tenantSlug,
      setupUrl,
      expiresAt: tokenExpiresAt,
    })

    await sendMail({
      to: superuserEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    return NextResponse.json({
      ok: true,
      signup,
      next: `/trial/check-email?email=${encodeURIComponent(superuserEmail)}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create trial signup" },
      { status: 500 }
    )
  }
}
