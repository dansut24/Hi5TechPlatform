"use client"

import { ArrowUpRight } from "lucide-react"
import { modules } from "@/data/mock-data"
import { cn } from "@/components/shared-ui"

function Pill({ children, theme }) {
  return <div className={cn("rounded-full border px-3 py-1 text-xs", theme.card, theme.muted)}>{children}</div>
}

function ShellCard({ children, theme, className = "" }) {
  return <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>{children}</div>
}

export default function ModuleSelector({ user, onEnterModule, theme }) {
  return (
    <div className="min-h-screen px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ShellCard theme={theme} className="mb-8 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-semibold", theme.card)}>{user.initials}</div>
                <div>
                  <div className={cn("text-sm", theme.muted)}>Welcome back</div>
                  <div className="text-2xl font-semibold tracking-tight">{user.name}</div>
                </div>
              </div>
              <p className={cn("mt-4 max-w-2xl text-sm", theme.muted)}>Choose a module. Each workspace is scoped by tenant access, role, and feature permissions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill theme={theme}>Tenant: Hi5Tech Managed Services</Pill>
              <Pill theme={theme}>Role: Platform Admin</Pill>
              <Pill theme={theme}>Environment: Production</Pill>
            </div>
          </div>
        </ShellCard>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <button key={module.id} onClick={() => onEnterModule(module.id)} className="group text-left">
                <ShellCard theme={theme} className="h-full overflow-hidden transition hover:scale-[1.01]">
                  <div className={cn("h-1.5 w-full", module.id === "itsm" ? "bg-cyan-400" : module.id === "control" ? "bg-violet-400" : module.id === "selfservice" ? "bg-emerald-400" : module.id === "admin" ? "bg-amber-400" : module.id === "analytics" ? "bg-blue-400" : "bg-slate-400")} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border", theme.card)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs", theme.card, theme.muted)}>{module.badge}</div>
                    </div>
                    <div className="mt-5 text-2xl font-semibold tracking-tight">{module.title}</div>
                    <div className={cn("mt-2 text-sm", theme.muted)}>{module.description}</div>
                    <div className={cn("mt-6 flex items-center justify-between text-sm", theme.muted)}>
                      <span>Open module</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </ShellCard>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
