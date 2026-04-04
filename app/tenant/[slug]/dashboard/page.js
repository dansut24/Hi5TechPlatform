import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"
import { themeMap } from "@/lib/themes"

export default async function TenantDashboardPage({ params }) {
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
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-sm uppercase tracking-[0.16em] text-cyan-300/80">
            {tenant.name}
          </div>

          <div className="mt-2 text-4xl font-semibold tracking-tight">
            Dashboard
          </div>

          <div className={`mt-3 text-sm ${theme.muted}`}>
            Your tenant workspace is active. This is now the default landing page after setup.
          </div>

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

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a
              href={`/tenant/${slug}/itsm`}
              className={`rounded-[24px] border p-5 transition ${theme.card} ${theme.hover}`}
            >
              <div className="text-lg font-semibold">ITSM</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                Incidents, requests, changes, knowledge.
              </div>
            </a>

            <a
              href={`/tenant/${slug}/control`}
              className={`rounded-[24px] border p-5 transition ${theme.card} ${theme.hover}`}
            >
              <div className="text-lg font-semibold">Control</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                Devices, actions, remote tools, monitoring.
              </div>
            </a>

            <a
              href={`/tenant/${slug}/admin`}
              className={`rounded-[24px] border p-5 transition ${theme.card} ${theme.hover}`}
            >
              <div className="text-lg font-semibold">Admin</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                Users, groups, modules, branding, tenant settings.
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
