import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"
import { themeMap } from "@/lib/themes"

export default async function TenantHomePage({ params }) {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const context = await getCurrentTenantContext()
  const { slug } = await params

  if (!context.user) {
    redirect(`/tenant/${slug}/login`)
  }

  const tenant = context.tenants.find((t) => t.slug === slug)

  if (!tenant) {
    redirect("/select-tenant")
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-4xl px-5 py-10">

        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          
          <div className="text-3xl font-semibold">
            {tenant.name}
          </div>

          <div className={`mt-2 text-sm ${theme.muted}`}>
            Your workspace is ready. You can now start using the platform.
          </div>

          {/* 👉 CTA BUTTON */}
          <div className="mt-6">
            <a
              href={`/tenant/${slug}/dashboard`}
              className={
                theme.resolved === "light"
                  ? "inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                  : "inline-flex rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
              }
            >
              Continue to platform →
            </a>
          </div>

          {/* Info cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-sm font-medium">Tenant</div>
              <div className="mt-2 text-lg font-semibold">{tenant.slug}</div>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-sm font-medium">Role</div>
              <div className="mt-2 text-lg font-semibold">{tenant.role}</div>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-sm font-medium">Plan</div>
              <div className="mt-2 text-lg font-semibold">{tenant.plan}</div>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-sm font-medium">Trial ends</div>
              <div className="mt-2 text-lg font-semibold">
                {tenant.trial_ends_at
                  ? new Date(tenant.trial_ends_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
