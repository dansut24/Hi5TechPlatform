"use client"

import { useRouter } from "next/navigation"
import { modules } from "@/data/mock-data"
import { tenantDashboardPath, tenantModulePath } from "@/lib/tenant/paths"

export default function ModuleSelector({ user, onEnterModule, theme, tenantSlug = null }) {
  const router = useRouter()

  const openModule = (moduleId) => {
    if (typeof onEnterModule === "function") {
      onEnterModule(moduleId)
      return
    }

    router.push(tenantModulePath(tenantSlug, moduleId))
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold tracking-tight">Choose a module</div>
            <div className={`mt-2 text-sm ${theme.muted}`}>
              Continue into the part of the platform you want to work in.
            </div>
          </div>

          <a
            href={tenantDashboardPath(tenantSlug)}
            className={`rounded-2xl border px-4 py-2 text-sm transition ${theme.card} ${theme.hover}`}
          >
            Refresh
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => openModule(module.id)}
              className={`rounded-[28px] border p-6 text-left shadow-xl transition ${theme.card} ${theme.hover}`}
            >
              <div className="text-xl font-semibold">{module.title}</div>
              <div className={`mt-3 text-sm ${theme.muted}`}>
                {module.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
