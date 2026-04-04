"use client"

import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/components/shared-ui"

const platformItems = [
  { id: "modules", label: "Module selector", icon: Grid3X3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "theme", label: "Theme", icon: Sparkles },
  { id: "support", label: "Support", icon: HelpCircle },
]

function SidebarButton({
  icon: Icon,
  label,
  selected = false,
  collapsed = false,
  onClick,
  theme,
  danger = false,
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition",
          danger
            ? "text-rose-300 hover:bg-rose-500/10"
            : selected
              ? theme.selected
              : theme.hover
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed ? <span className="truncate text-sm font-medium">{label}</span> : null}
        </span>
        {!collapsed ? (
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0",
              danger ? "text-rose-300/70" : theme.muted2
            )}
          />
        ) : null}
      </button>

      {collapsed ? (
        <div
          className={cn(
            "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs shadow-xl group-hover:block",
            theme.panel
          )}
        >
          {label}
        </div>
      ) : null}
    </div>
  )
}

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
  tenantSlug,
}) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:flex-col lg:border-r lg:backdrop-blur-xl",
        theme.header,
        collapsed ? "lg:w-[84px]" : "lg:w-[280px]"
      )}
    >
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className={cn("mb-2 px-2 text-[11px] uppercase tracking-[0.16em]", theme.muted2)}>
          {!collapsed ? "Current module" : ""}
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              selected={activeNav === item.id}
              collapsed={collapsed}
              onClick={() => onSwitchPage(item.id, item.label)}
              theme={theme}
            />
          ))}
        </div>
      </div>

      <div className={cn("border-t px-3 py-4", theme.line)}>
        <div className="space-y-1">
          {platformItems.map((item) => {
            const onClick = item.id === "modules" ? onGoModules : undefined

            return (
              <SidebarButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                onClick={onClick}
                theme={theme}
              />
            )
          })}

          <SidebarButton
            icon={LogOut}
            label="Log out"
            collapsed={collapsed}
            onClick={onLogout}
            theme={theme}
            danger
          />
        </div>

        <div className={cn("mt-4 rounded-2xl border p-3", theme.card)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold",
                theme.card
              )}
            >
              {user.initials}
            </div>

            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className={cn("truncate text-xs", theme.muted)}>{user.role}</div>
                {tenantSlug ? (
                  <div className={cn("truncate text-[11px]", theme.muted2)}>
                    {tenantSlug}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={cn("mt-3 border-t pt-3", theme.line)}>
            <div className="group relative">
              <button
                onClick={() => setCollapsed((v) => !v)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "flex w-full items-center justify-center rounded-2xl border px-3 py-3 transition",
                  theme.card,
                  theme.hover
                )}
              >
                {collapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Collapse</span>
                  </div>
                )}
              </button>

              {collapsed ? (
                <div
                  className={cn(
                    "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs shadow-xl group-hover:block",
                    theme.panel
                  )}
                >
                  Expand sidebar
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
