"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Cpu,
  Grid3X3,
  Shield,
  Sparkles,
  UserCircle2,
  Wrench,
} from "lucide-react"
import { modules } from "@/data/mock-data"
import { tenantDashboardPath, tenantModulePath } from "@/lib/tenant/paths"
import { cn } from "@/components/shared-ui"

const iconMap = {
  itsm: Blocks,
  control: Cpu,
  selfservice: UserCircle2,
  admin: Shield,
  analytics: BarChart3,
  automation: Wrench,
}

const accentMap = {
  itsm: {
    bg: "from-cyan-500/20 via-sky-500/10 to-transparent",
    bar: "from-cyan-400 via-sky-400 to-blue-400",
  },
  control: {
    bg: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    bar: "from-violet-400 via-fuchsia-400 to-pink-400",
  },
  selfservice: {
    bg: "from-emerald-500/20 via-teal-500/10 to-transparent",
    bar: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  admin: {
    bg: "from-amber-500/20 via-orange-500/10 to-transparent",
    bar: "from-amber-400 via-orange-400 to-yellow-400",
  },
  analytics: {
    bg: "from-blue-500/20 via-indigo-500/10 to-transparent",
    bar: "from-blue-400 via-indigo-400 to-violet-400",
  },
  automation: {
    bg: "from-pink-500/20 via-rose-500/10 to-transparent",
    bar: "from-pink-400 via-rose-400 to-orange-400",
  },
}

function initialsFromUser(user) {
  if (user?.initials) return user.initials
  const source = user?.name?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U"
}

export default function ModuleSelector({
  user,
  onEnterModule,
  theme,
  tenantSlug = null,
}) {
  const router = useRouter()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [])

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
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className={cn("rounded-[32px] border p-6 shadow-2xl backdrop-blur-2xl lg:p-8", theme.card)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border text-sm font-semibold", theme.card)}>
                  {initialsFromUser(user)}
                </div>

                <div className="min-w-0">
                  <div className={cn("text-sm", theme.muted)}>
                    {greeting}
                  </div>
                  <div className="truncate text-3xl font-semibold tracking-tight">
                    {user?.name || "Welcome back"}
                  </div>
                  <div className={cn("mt-1 text-sm", theme.muted)}>
                    Pick a workspace module to continue.
                  </div>
                </div>
              </div>

              <a
                href={tenantDashboardPath(tenantSlug)}
                className={cn("hidden rounded-2xl border px-4 py-2 text-sm transition md:inline-flex", theme.card, theme.hover)}
              >
                Refresh
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const Icon = iconMap[module.id] || Grid3X3
                const accent = accentMap[module.id] || {
                  bg: "from-cyan-500/20 via-sky-500/10 to-transparent",
                  bar: "from-cyan-400 via-sky-400 to-blue-400",
                }

                return (
                  <button
                    key={module.id}
                    onClick={() => openModule(module.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-[28px] border p-5 text-left shadow-xl transition",
                      theme.card,
                      theme.hover
                    )}
                  >
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100", accent.bg)} />

                    <div className="relative">
                      <div className={cn("mb-4 h-1.5 w-24 rounded-full bg-gradient-to-r shadow-[0_0_18px_rgba(255,255,255,0.12)]", accent.bar)} />

                      <div className="flex items-start justify-between gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl", theme.card)}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100", theme.card)}>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-5 text-xl font-semibold tracking-tight">
                        {module.title}
                      </div>

                      <div className={cn("mt-2 text-sm leading-6", theme.muted)}>
                        {module.description}
                      </div>

                      <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Open module</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6">
            <div className={cn("rounded-[32px] border p-6 shadow-2xl backdrop-blur-2xl", theme.card)}>
              <div className="text-lg font-semibold">Workspace summary</div>
              <div className={cn("mt-2 text-sm", theme.muted)}>
                Your tenant workspace is ready and routing is now tenant-aware.
              </div>

              <div className="mt-6 grid gap-3">
                <div className={cn("rounded-2xl border p-4", theme.card)}>
                  <div className={cn("text-xs uppercase tracking-[0.16em]", theme.muted2)}>
                    Tenant
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {tenantSlug || "Default workspace"}
                  </div>
                </div>

                <div className={cn("rounded-2xl border p-4", theme.card)}>
                  <div className={cn("text-xs uppercase tracking-[0.16em]", theme.muted2)}>
                    Modules
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {modules.length}
                  </div>
                </div>

                <div className={cn("rounded-2xl border p-4", theme.card)}>
                  <div className={cn("text-xs uppercase tracking-[0.16em]", theme.muted2)}>
                    Access
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {user?.role || "User"}
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("rounded-[32px] border p-6 shadow-2xl backdrop-blur-2xl", theme.card)}>
              <div className="text-lg font-semibold">Quick start</div>
              <div className={cn("mt-2 text-sm", theme.muted)}>
                Recommended next steps for a new tenant workspace.
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Open ITSM to review incidents and requests",
                  "Check Control for device visibility and actions",
                  "Use Admin to review branding, users, and groups",
                ].map((item) => (
                  <div key={item} className={cn("rounded-2xl border p-4 text-sm", theme.card)}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
