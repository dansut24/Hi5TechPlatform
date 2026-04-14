import { NextResponse } from "next/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"
import {
  clearStepUpChallenge,
  consumeRecoveryCode,
  getStepUpChallenge,
  verifyTotpCode,
} from "@/lib/auth/step-up-auth"
import { logActivity } from "@/lib/activity/log-activity"

export async function POST(req, { params }) {
  const { slug } = params
  const body = await req.json()

  const code = String(body.code || "").trim()
  const recoveryCode = String(body.recoveryCode || "").trim()

  if (!code && !recoveryCode) {
    return NextResponse.json(
      { error: "Code is required" },
      { status: 400 }
    )
  }

  const challenge = await getStepUpChallenge()

  if (!challenge || challenge.tenantSlug !== slug) {
    return NextResponse.json(
      { error: "2FA challenge expired. Please sign in again." },
      { status: 401 }
    )
  }

  let verified = false

  if (code) {
    verified = await verifyTotpCode({
      userId: challenge.userId,
      code,
    })
  } else if (recoveryCode) {
    verified = await consumeRecoveryCode({
      userId: challenge.userId,
      code: recoveryCode,
    })
  }

  if (!verified) {
    await logActivity({
      tenantId: challenge.tenantId,
      actorUserId: challenge.userId,
      entityType: "auth",
      entityId: challenge.userId,
      eventType: "2fa_failed",
      message: "2FA verification failed",
      metadata: {
        used_recovery_code: Boolean(recoveryCode),
      },
    })

    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    )
  }

  if (challenge.rememberDevice) {
    await createTrustedDevice({
      tenantId: challenge.tenantId,
      userId: challenge.userId,
      deviceName: challenge.deviceName,
      rememberDeviceDays: 30,
    })

    await logActivity({
      tenantId: challenge.tenantId,
      actorUserId: challenge.userId,
      entityType: "auth",
      entityId: challenge.userId,
      eventType: "trusted_device_created",
      message: "Trusted device created after successful 2FA",
      metadata: {
        device_name: challenge.deviceName,
      },
    })
  }

  await logActivity({
    tenantId: challenge.tenantId,
    actorUserId: challenge.userId,
    entityType: "auth",
    entityId: challenge.userId,
    eventType: "2fa_success",
    message: "2FA verified",
    metadata: {
      used_recovery_code: Boolean(recoveryCode),
    },
  })

  await clearStepUpChallenge()

  return NextResponse.json({
    success: true,
    redirectTo: challenge.redirectTo || `/tenant/${slug}/dashboard`,
  })
}
