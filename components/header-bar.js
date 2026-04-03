"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, ChevronDown, ChevronRight, PanelLeft, Sparkles } from "lucide-react"
import { cn } from "@/components/shared-ui"

function HeaderBreadcrumbs({ currentModuleTitle, navItems, activeNav, theme }) {
  const activeItem = navItems.find((item) => item.id === activeNav) || navItems[0]

  const breadcrumbs = useMemo(() => {
    const items = [currentModuleTitle]
    if (activeItem?.label) items.push(activeItem.label)
    return items
  }, [currentModuleTitle, activeItem])

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
        {breadcrumbs.map((item, index) => (
          <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <span className={cn("shrink-0 opacity-50", theme.muted2)}>/</span> : null}
            <span
              className={cn(
                "truncate",
                index === breadcrumbs.length - 1 ? "font-medium" : theme.muted
              )}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderWorkspaceSwitch({ currentModuleTitle, navItems, activeNav, onSwitch, theme }) {
  const [open, setOpen] = useState(false)
  const activeItem = navItems.find((item) => item.id === activeNav) || navItems[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition", theme.card, theme.hover)}
      >
        <div className="min-w-0">
          <div className={cn("text-[10px] uppercase tracking-[0.16em]", theme.muted2)}>{currentModuleTitle}</div>
          <div className="truncate text-sm font-medium">{activeItem?.label || "Section"}</div>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition", open ? "rotate-180" : "rotate-0", theme.muted2)} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn("absolute right-0 top-12 z-[100] min-w-[280px] rounded-3xl border p-3 shadow-2xl shadow-black/40", theme.panel)}
          >
            <div className={cn("mb-2 px-2 text-[11px] uppercase tracking-[0.16em]", theme.muted2)}>Quick switch</div>
            <div className="space-y-1">
              {navItems.slice(0, 8).map((item) => {
                const Icon = item.icon
                const selected = item.id === activeNav

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSwitch(item.id, item.label)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                      selected ? theme.selected : theme.hover
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function NotificationBell({ theme, mobile = false }) {
  const [open, setOpen] = useState(false)

  const notifications = [
    { title: "P1 incident assigned", detail: "INC-10492 moved to Network", time: "2m" },
    { title: "CAB approval pending", detail: "2 changes awaiting approval", time: "14m" },
    { title: "Patch compliance improved", detail: "Control workspace now at 91.4%", time: "1h" },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center rounded-xl border transition",
          mobile ? "h-10 w-10" : "h-9 w-9",
          theme.card,
          theme.hover
        )}
      >
        <Bell className={mobile ? "h-4.5 w-4.5" : "h-4 w-4"} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              mobile
                ? "absolute bottom-12 left-1/2 z-[100] w-[320px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-3xl border p-3 shadow-2xl shadow-black/40"
                : "absolute right-0 top-12 z-[100] w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40",
              theme.panel
            )}
          >
            <div className="mb-2 px-2 text-sm font-medium">Notifications</div>
            <div className="space-y-2">
              {notifications.map((item) => (
                <div key={item.title} className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className={cn("mt-1 text-xs", theme.muted)}>{item.detail}</div>
                    </div>
                    <div className={cn("text-[11px]", theme.muted2)}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function ProfileMenu({ user, onGoModules, onLogout, theme }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("flex items-center gap-2 rounded-xl border px-2 py-1.5 transition", theme.card, theme.hover)}
      >
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-semibold", theme.card)}>
          {user.initials}
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn("absolute right-0 top-12 z-[100] w-[260px] rounded-3xl border p-3 shadow-2xl shadow-black/40", theme.panel)}
          >
            <div className={cn("mb-3 flex items-center gap-3 rounded-2xl border p-3", theme.subCard, theme.line)}>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-semibold", theme.card)}>
                {user.initials}
              </div>
              <div>
                <div className="text-sm font-medium">{user.name}</div>
                <div className={cn("text-xs", theme.muted)}>{user.role}</div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onGoModules}
                className={cn("flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition", theme.hover)}
              >
                <span>Module selector</span>
                <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
              </button>

              <button
                className={cn("flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition", theme.hover)}
              >
                <span>Profile settings</span>
                <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
              </button>

              <button
                onClick={onLogout}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
              >
                <span>Log out</span>
                <ChevronRight className="h-4 w-4 text-rose-300/70" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { NotificationBell }

export default function HeaderBar({
  user,
  onGoModules,
  onLogout,
  theme,
  currentModuleTitle,
  navItems,
  activeNav,
  onSwitchPage,
  navMode,
  setNavMode,
}) {
  return (
    <div
      className={cn("relative z-50 border-b backdrop-blur-xl", theme.header)}
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border", theme.card)}>
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="hidden min-w-0 md:block">
            <div className="text-sm font-semibold tracking-tight">Hi5Tech</div>
            <div className={cn("text-[11px]", theme.muted2)}>Service Platform</div>
          </div>

          <div className="min-w-0">
            <HeaderBreadcrumbs
              currentModuleTitle={currentModuleTitle}
              navItems={navItems}
              activeNav={activeNav}
              theme={theme}
            />
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setNavMode((prev) => (prev === "floating" ? "sidebar" : "floating"))}
            className={cn("hidden h-9 items-center gap-2 rounded-xl border px-3 text-sm transition lg:flex", theme.card, theme.hover)}
          >
            <PanelLeft className="h-4 w-4" />
            <span>{navMode === "floating" ? "Sidebar" : "Floating"}</span>
          </button>

          <HeaderWorkspaceSwitch
            currentModuleTitle={currentModuleTitle}
            navItems={navItems}
            activeNav={activeNav}
            onSwitch={onSwitchPage}
            theme={theme}
          />

          <NotificationBell theme={theme} />
          <ProfileMenu user={user} onGoModules={onGoModules} onLogout={onLogout} theme={theme} />
        </div>
      </div>
    </div>
  )
}
