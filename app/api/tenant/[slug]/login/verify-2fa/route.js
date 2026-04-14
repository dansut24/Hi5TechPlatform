import { NextResponse } from "next/server"
import { createTrustedDevice } from "@/lib/auth/trusted-devices"
import {
  clearStepUpChallenge,
  consumeRecoveryCode,
  getStepUpChallenge,
  verifyTotpCode,
} from "@/lib/auth/step-up-auth"

export async function POST(_req, { params }) {
  const { slug } = await params
  const body = await _req.json()

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
  }

  await clearStepUpChallenge()

  return NextResponse.json({
    success: true,
    redirectTo: challenge.redirectTo || `/tenant/${slug}/dashboard`,
  })
}
