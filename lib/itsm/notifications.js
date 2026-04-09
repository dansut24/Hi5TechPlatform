import { sendMail } from "@/lib/email/smtp"

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function sendIncidentCreatedEmail({ tenantName, incident }) {
  if (!incident?.submitted_by_email) return

  const subject = `[${tenantName}] Incident received: ${incident.number}`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>We received your incident</h2>
      <p>Your incident has been logged successfully.</p>
      <p><strong>Number:</strong> ${escapeHtml(incident.number)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(incident.short_description)}</p>
      <p>You will receive further updates as the incident progresses.</p>
    </div>
  `

  const text = [
    "We received your incident.",
    "",
    `Number: ${incident.number}`,
    `Summary: ${incident.short_description || ""}`,
    "",
    "You will receive further updates as the incident progresses.",
  ].join("\n")

  await sendMail({
    to: incident.submitted_by_email,
    subject,
    html,
    text,
  })
}

export async function sendIncidentUpdatedEmail({ tenantName, incident, statusLabel }) {
  if (!incident?.submitted_by_email) return

  const subject = `[${tenantName}] Incident updated: ${incident.number}`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Your incident has been updated</h2>
      <p><strong>Number:</strong> ${escapeHtml(incident.number)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(incident.short_description)}</p>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel || incident.status || "Updated")}</p>
      ${
        incident.resolution_notes
          ? `<p><strong>Latest notes:</strong><br/>${escapeHtml(incident.resolution_notes)}</p>`
          : ""
      }
    </div>
  `

  const text = [
    "Your incident has been updated.",
    "",
    `Number: ${incident.number}`,
    `Summary: ${incident.short_description || ""}`,
    `Status: ${statusLabel || incident.status || "Updated"}`,
    incident.resolution_notes ? `Latest notes: ${incident.resolution_notes}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  await sendMail({
    to: incident.submitted_by_email,
    subject,
    html,
    text,
  })
}

export async function sendIncidentResolvedEmail({ tenantName, incident, surveyUrl }) {
  if (!incident?.submitted_by_email) return

  const subject = `[${tenantName}] Incident resolved: ${incident.number}`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Your incident has been resolved</h2>
      <p><strong>Number:</strong> ${escapeHtml(incident.number)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(incident.short_description)}</p>
      ${
        incident.resolution_notes
          ? `<p><strong>Resolution notes:</strong><br/>${escapeHtml(incident.resolution_notes)}</p>`
          : ""
      }
      ${
        surveyUrl
          ? `<p><a href="${escapeHtml(surveyUrl)}">Share feedback about this incident</a></p>`
          : ""
      }
    </div>
  `

  const text = [
    "Your incident has been resolved.",
    "",
    `Number: ${incident.number}`,
    `Summary: ${incident.short_description || ""}`,
    incident.resolution_notes ? `Resolution notes: ${incident.resolution_notes}` : null,
    surveyUrl ? `Survey: ${surveyUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  await sendMail({
    to: incident.submitted_by_email,
    subject,
    html,
    text,
  })
}

export async function sendIncidentRequesterCommentNotification({
  tenantName,
  incident,
  commentBody,
  notifyTo,
}) {
  if (!notifyTo) return

  const subject = `[${tenantName}] Requester replied on ${incident.number}`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Requester update received</h2>
      <p><strong>Incident:</strong> ${escapeHtml(incident.number)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(incident.short_description)}</p>
      <p><strong>Requester message:</strong><br/>${escapeHtml(commentBody)}</p>
    </div>
  `

  const text = [
    "Requester update received.",
    "",
    `Incident: ${incident.number}`,
    `Summary: ${incident.short_description || ""}`,
    "",
    `Requester message: ${commentBody || ""}`,
  ].join("\n")

  await sendMail({
    to: notifyTo,
    subject,
    html,
    text,
  })
}

export async function sendIncidentReopenedNotification({
  tenantName,
  incident,
  notifyTo,
}) {
  if (!notifyTo) return

  const subject = `[${tenantName}] Incident reopened: ${incident.number}`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Incident reopened by requester</h2>
      <p><strong>Incident:</strong> ${escapeHtml(incident.number)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(incident.short_description)}</p>
      <p>The requester has reopened this incident and it may need further attention.</p>
    </div>
  `

  const text = [
    "Incident reopened by requester.",
    "",
    `Incident: ${incident.number}`,
    `Summary: ${incident.short_description || ""}`,
    "",
    "The requester has reopened this incident and it may need further attention.",
  ].join("\n")

  await sendMail({
    to: notifyTo,
    subject,
    html,
    text,
  })
}
