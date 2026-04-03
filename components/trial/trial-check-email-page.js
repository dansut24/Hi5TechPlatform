"use client"

import { useSearchParams } from "next/navigation"

export default function TrialCheckEmailPage({ theme }) {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || "your email"

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-lg rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Check your email</div>
          <div className={`mt-3 text-sm ${theme.muted}`}>
            We’ve sent a secure tenant setup link to <span className="font-medium">{email}</span>.
          </div>

          <div className={`mt-6 rounded-[24px] border p-5 text-left ${theme.card}`}>
            <div className="text-sm font-medium">Next step</div>
            <div className={`mt-2 text-sm ${theme.muted}`}>
              Open the email, click the setup link, then complete the tenant owner password setup flow.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
