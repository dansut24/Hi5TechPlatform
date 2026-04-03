import nodemailer from "nodemailer"

let transporterPromise = null

function parsePort(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function getSmtpTransporter() {
  if (transporterPromise) return transporterPromise

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST
    const port = parsePort(process.env.SMTP_PORT, 587)
    const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true"
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      throw new Error("Missing SMTP configuration")
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    })

    await transporter.verify()
    return transporter
  })()

  return transporterPromise
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = await getSmtpTransporter()

  const info = await transporter.sendMail({
    from: process.env.TRIAL_EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  })

  return info
}
