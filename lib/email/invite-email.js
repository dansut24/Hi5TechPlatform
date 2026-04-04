export function buildTenantInviteEmail({
  tenantName,
  tenantSlug,
  inviteUrl,
  invitedByName,
  role,
  expiresAt,
}) {
  const expiresText = new Date(expiresAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })

  return {
    subject: `You’ve been invited to ${tenantName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0b0d12;color:#e5e7eb;padding:32px">
        <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px">
          <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em">You’ve been invited</div>
          <p style="margin-top:16px;color:#cbd5e1;font-size:15px;line-height:1.7">
            ${invitedByName || "An administrator"} invited you to join <strong>${tenantName}</strong> as <strong>${role}</strong>.
          </p>
          <div style="margin:28px 0">
            <a href="${inviteUrl}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:14px 22px;border-radius:16px;font-weight:600">
              Accept invite
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
          <p style="word-break:break-all;color:#cbd5e1;font-size:13px">${inviteUrl}</p>
        </div>
      </div>
    `,
    text: `You've been invited to ${tenantName} as ${role}.

Accept invite:
${inviteUrl}

Tenant URL: /tenant/${tenantSlug}
Link expires: ${new Date(expiresAt).toISOString()}
`,
  }
}
