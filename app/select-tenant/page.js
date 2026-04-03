import { redirect } from "next/navigation"
import { getCurrentTenantContext } from "@/lib/tenant/get-current-context"
import { themeMap } from "@/lib/themes"

export default async function SelectTenantPage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  const context = await getCurrentTenantContext()

  if (!context.user) {
    redirect("/login")
  }

  if (context.tenants.length === 0) {
    redirect("/create-workspace")
  }

  if (context.tenants.length === 1) {
    redirect(`/tenant/${context.tenants[0].slug}`)
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Choose a workspace</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Your account belongs to more than one tenant. Pick where you want to go.
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {context.tenants.map((tenant) => (
              <a
                key={tenant.tenantId}
                href={`/tenant/${tenant.slug}`}
                className={`rounded-[24px] border p-5 transition ${theme.card} ${theme.hover}`}
              >
                <div className="text-lg font-semibold">{tenant.name}</div>
                <div className={`mt-1 text-sm ${theme.muted}`}>{tenant.slug}</div>
                <div className="mt-4 text-xs uppercase tracking-[0.16em]">{tenant.role}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
