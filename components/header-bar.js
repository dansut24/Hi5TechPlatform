"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Sparkles } from "lucide-react"
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
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[13px] sm:text-sm">
        {breadcrumbs.map((item, index) => (
          <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-1.5">
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
          mobile ? "h-9 w-9 lg:h-10 lg:w-10" : "h-8 w-8 lg:h-9 lg:w-9",
          theme.card,
          theme.hover
        )}
      >
        <Bell className={mobile ? "h-4 w-4 lg:h-4.5 lg:w-4.5" : "h-3.5 w-3.5 lg:h-4 lg:w-4"} />
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
                ? "absolute bottom-11 left-1/2 z-[100] w-[300px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-3xl border p-3 shadow-2xl shadow-black/40"
                : "absolute right-0 top-11 z-[100] w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40 lg:top-12",
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

export { NotificationBell }

export default function HeaderBar({
  theme,
  currentModuleTitle,
  navItems,
  activeNav,
  branding = null,
  tenantName = "",
}) {
  return (
    <div
      className={cn("relative z-50 border-b backdrop-blur-xl", theme.header)}
      style={{
        height: "var(--header-height)",
        background: branding?.brandHex
          ? `linear-gradient(180deg, rgba(var(--tenant-brand-rgb),0.10), rgba(var(--tenant-brand-rgb),0.03))`
          : undefined,
        borderColor: branding?.brandHex
          ? "rgba(var(--tenant-brand-rgb),0.12)"
          : undefined,
      }}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 py-2 lg:px-6 lg:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border lg:h-9 lg:w-9",
              theme.card
            )}
            style={{
              boxShadow: branding?.brandHex
                ? "0 0 0 1px rgba(var(--tenant-brand-rgb),0.14), 0 0 20px rgba(var(--tenant-brand-rgb),0.10)"
                : undefined,
            }}
          >
            <Sparkles
              className="h-3.5 w-3.5 lg:h-4 lg:w-4"
              style={{
                color: branding?.brandHex || undefined,
              }}
            />
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

        <div className="flex shrink-0 items-center gap-2">
          {tenantName ? (
            <div
              className={cn(
                "hidden rounded-full border px-3 py-1 text-xs md:inline-flex",
                theme.card,
                theme.muted
              )}
              style={{
                borderColor: branding?.brandHex
                  ? "rgba(var(--tenant-brand-rgb),0.18)"
                  : undefined,
                background: branding?.brandHex
                  ? "rgba(var(--tenant-brand-rgb),0.08)"
                  : undefined,
              }}
            >
              {tenantName}
            </div>
          ) : null}

          <NotificationBell theme={theme} />
        </div>
      </div>
    </div>
  )
}
