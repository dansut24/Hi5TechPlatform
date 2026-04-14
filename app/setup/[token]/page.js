import { redirect } from "next/navigation"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { themeMap } from "@/lib/themes"

export default async function SetupTokenPage({ params }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const admin = getSupabaseAdminClient()
  const { token } = params

  const { data: signup, error } = await admin
    .from("trial_signups")
    .select("*")
    .eq("signup_token", token)
    .maybeSingle()

  if (error) {
    return (
      <div className={`min-h-screen ${theme.app}`}>
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className={`w-full max-w-lg rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
            <div className="text-2xl font-semibold">Setup link error</div>
            <div className={`mt-3 text-sm ${theme.muted}`}>
              We couldn’t validate this setup link right now.
            </div>
            <div className="mt-6">
              <a
                href="/trial/start"
                className={
                  theme.resolved === "light"
                    ? "inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                    : "inline-flex rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
                }
              >
                Start again
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!signup) {
    return (
      <div className={`min-h-screen ${theme.app}`}>
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className={`w-full max-w-lg rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
            <div className="text-2xl font-semibold">Invalid setup link</div>
            <div className={`mt-3 text-sm ${theme.muted}`}>
              This setup link could not be found. It may have expired or already been replaced by a newer signup.
            </div>
            <div className="mt-6">
              <a
                href="/trial/start"
                className={
                  theme.resolved === "light"
                    ? "inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                    : "inline-flex rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
                }
              >
                Start free trial again
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (new Date(signup.token_expires_at).getTime() < Date.now()) {
    return (
      <div className={`min-h-screen ${theme.app}`}>
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className={`w-full max-w-lg rounded-[28px] border p-8 text-center shadow-2xl backdrop-blur-2xl ${theme.card}`}>
            <div className="text-2xl font-semibold">Setup link expired</div>
            <div className={`mt-3 text-sm ${theme.muted}`}>
              This setup link has expired. Start a new trial setup to continue.
            </div>
            <div className="mt-6">
              <a
                href="/trial/start"
                className={
                  theme.resolved === "light"
                    ? "inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                    : "inline-flex rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
                }
              >
                Start again
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (signup.status === "completed") {
    redirect(`/tenant/${signup.tenant_slug}/login`)
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className={`w-full max-w-2xl rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Complete tenant setup</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            This link is valid. Continue to prepare your owner account and finish setup.
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={`rounded-[24px] border p-4 ${theme.card}`}>
              <div className="text-sm font-medium">Company</div>
              <div className="mt-2 text-lg font-semibold">{signup.company_name}</div>
            </div>

            <div className={`rounded-[24px] border p-4 ${theme.card}`}>
              <div className="text-sm font-medium">Tenant slug</div>
              <div className="mt-2 text-lg font-semibold">{signup.tenant_slug}</div>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={`/setup/${token}/complete`}
              className={
                theme.resolved === "light"
                  ? "inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                  : "inline-flex rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
              }
            >
              Continue setup
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
