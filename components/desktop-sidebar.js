"use client"

import { ChevronRight, ChevronsLeft, ChevronsRight, Grid3X3, LogOut, Settings, Bell, HelpCircle, Sparkles } from "lucide-react"
import { cn } from "@/components/shared-ui"

const platformItems = [
  { id: "modules", label: "Module selector", icon: Grid3X3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "theme", label: "Theme", icon: Sparkles },
  { id: "support", label: "Support", icon: HelpCircle },
]

export default function DesktopSidebar({
  user,
  navItems,
  activeNav,
  onSwitchPage,
  onGoModules,
  onLogout,
  collapsed,
  setCollapsed,
  theme,
}) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:flex-col lg:border-r lg:backdrop-blur-xl",
        theme.header,
        collapsed ? "lg:w-[84px]" : "lg:w-[280px]"
      )}
    >
      <div className={cn("flex items-center justify-between border-b px-4 py-4", theme.line)}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border", theme.card)}>
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed ? (
            <div>
              <div className="text-sm font-semibold tracking-tight">Hi5Tech</div>
              <div className={cn("text-[11px]", theme.muted2)}>Service Platform</div>
            </div>
          ) : null}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition", theme.card, theme.hover)}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className={cn("mb-2 px-2 text-[11px] uppercase tracking-[0.16em]", theme.muted2)}>
          {!collapsed ? "Current module" : ""}
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const selected = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSwitchPage(item.id, item.label)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition",
                  selected ? theme.selected : theme.hover
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
                </span>
                {!collapsed ? <ChevronRight className={cn("h-4 w-4 shrink-0", theme.muted2)} /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className={cn("border-t px-3 py-4", theme.line)}>
        <div className="space-y-1">
          {platformItems.map((item) => {
            const Icon = item.icon
            const onClick = item.id === "modules" ? onGoModules : undefined
            return (
              <button
                key={item.id}
                onClick={onClick}
                title={collapsed ? item.label : undefined}
                className={cn("flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition", theme.hover)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
                </span>
                {!collapsed ? <ChevronRight className={cn("h-4 w-4 shrink-0", theme.muted2)} /> : null}
              </button>
            )
          })}
          <button
            onClick={onLogout}
            title={collapsed ? "Log out" : undefined}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-rose-300 transition hover:bg-rose-500/10"
          >
            <span className="flex min-w-0 items-center gap-3">
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed ? <span className="truncate text-sm font-medium">Log out</span> : null}
            </span>
            {!collapsed ? <ChevronRight className="h-4 w-4 shrink-0 text-rose-300/70" /> : null}
          </button>
        </div>

        <div className={cn("mt-4 flex items-center gap-3 rounded-2xl border p-3", theme.card)}>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold", theme.card)}>
            {user.initials}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className={cn("truncate text-xs", theme.muted)}>{user.role}</div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
