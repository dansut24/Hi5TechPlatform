"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  ChevronRight,
  Grid3X3,
  Menu,
  Search,
  Sparkles,
  UserCircle2,
  LayoutDashboard,
  Settings,
  XCircle,
} from "lucide-react"
import { cn } from "@/components/shared-ui"
import { NotificationBell } from "@/components/header-bar"

const platformItems = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Account Settings", icon: Settings },
  { label: "Theme", icon: Sparkles },
  { label: "Support", icon: UserCircle2 },
  { label: "Docs", icon: BookOpen },
]

function ThemeControl({ themeMode, setThemeMode, customTheme, setCustomTheme, theme }) {
  const themeButton = (key, icon) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setThemeMode(key)
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full transition lg:h-8 lg:w-8",
        themeMode === key ? theme.soft : theme.muted
      )}
    >
      {icon}
    </button>
  )

  return (
    <span className="ml-3 flex items-center gap-2">
      <span className={cn("inline-flex items-center rounded-full border p-1", theme.card)}>
        {themeButton(
          "light",
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 lg:h-4 lg:w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
        {themeButton(
          "dark",
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 lg:h-4 lg:w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
          </svg>
        )}
        {themeButton(
          "system",
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 lg:h-4 lg:w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M9 8h6" />
          </svg>
        )}
        {themeButton("custom", <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4" />)}
      </span>

      {themeMode === "custom" ? (
        <span className={cn("inline-flex items-center rounded-full border p-1", theme.card)}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCustomTheme("midnight")
            }}
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] transition lg:h-7 lg:px-3 lg:text-[11px]",
              customTheme === "midnight" ? theme.soft : theme.muted
            )}
          >
            Midnight
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCustomTheme("emerald")
            }}
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] transition lg:h-7 lg:px-3 lg:text-[11px]",
              customTheme === "emerald" ? theme.soft : theme.muted
            )}
          >
            Emerald
          </button>
        </span>
      ) : null}
    </span>
  )
}

export default function FloatingMenu({
  navItems,
  activeNav,
  onSwitchPage,
  onGoModules,
  onLogout,
  menuOpen,
  setMenuOpen,
  onOpenSearch,
  themeMode,
  setThemeMode,
  customTheme,
  setCustomTheme,
  theme,
  navMode,
  user,
  tenantSlug,
  branding,
  tenantName,
}) {
  const [isKeyboardLikeOpen, setIsKeyboardLikeOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const getViewportHeight = () => window.visualViewport?.height || window.innerHeight
    let initialHeight = getViewportHeight()

    const handleViewportChange = () => {
      const currentHeight = getViewportHeight()
      const delta = initialHeight - currentHeight
      setIsKeyboardLikeOpen(delta > 140)
    }

    const handleResize = () => {
      const active = document.activeElement
      const isTextInput =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.getAttribute?.("contenteditable") === "true")

      if (!isTextInput) {
        initialHeight = getViewportHeight()
        setIsKeyboardLikeOpen(false)
      }

      handleViewportChange()
    }

    window.addEventListener("resize", handleResize)
    window.visualViewport?.addEventListener("resize", handleViewportChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.visualViewport?.removeEventListener("resize", handleViewportChange)
    }
  }, [])

  const floatingBarBottomClass = isKeyboardLikeOpen ? "bottom-24 lg:bottom-6" : "bottom-5 lg:bottom-6"
  const menuBottomClass = isKeyboardLikeOpen ? "bottom-[116px] lg:bottom-24" : "bottom-[72px] lg:bottom-24"

  return (
    <>
      <AnimatePresence>
        {!menuOpen ? (
          <motion.div
            key="floating-pill"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "fixed left-1/2 z-50 -translate-x-1/2",
              floatingBarBottomClass,
              navMode === "sidebar" ? "lg:hidden" : ""
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-[22px] border px-2 py-1.5 shadow-2xl backdrop-blur-2xl lg:gap-2 lg:rounded-[26px] lg:px-2.5 lg:py-2",
                theme.floating
              )}
              style={{
                boxShadow: branding?.brandHex
                  ? "0 0 0 1px rgba(var(--tenant-brand-rgb),0.12), 0 14px 40px rgba(var(--tenant-brand-rgb),0.12)"
                  : undefined,
              }}
            >
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-[16px] px-3 text-sm transition lg:h-10 lg:rounded-[20px]",
                  theme.hover
                )}
                onClick={onOpenSearch}
              >
                <Search className="h-4 w-4" />
                <span>Search...</span>
              </button>

              <div
                className={cn(
                  "h-6 w-px lg:h-7",
                  theme.resolved === "light" ? "bg-slate-200" : "bg-white/10"
                )}
              />

              <NotificationBell
                theme={theme}
                mobile
                tenantSlug={tenantSlug}
              />

              <div
                className={cn(
                  "h-6 w-px lg:h-7",
                  theme.resolved === "light" ? "bg-slate-200" : "bg-white/10"
                )}
              />

              <button
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-[16px] transition lg:h-10 lg:w-10 lg:rounded-[18px]",
                  theme.hover
                )}
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              key="floating-menu-sheet"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "absolute left-1/2 z-[100] w-[390px] max-w-[calc(100vw-20px)] -translate-x-1/2 rounded-[28px] border p-2.5 shadow-2xl shadow-black/50 lg:w-[420px] lg:max-w-[calc(100vw-24px)] lg:rounded-[32px] lg:p-3",
                menuBottomClass,
                theme.panel
              )}
              style={{
                boxShadow: branding?.brandHex
                  ? "0 0 0 1px rgba(var(--tenant-brand-rgb),0.12), 0 24px 60px rgba(var(--tenant-brand-rgb),0.16)"
                  : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn("border-b px-2 pb-2.5 pt-2 lg:pb-3", theme.line)}>
                <div className={cn("mb-2 text-[10px] uppercase tracking-[0.18em] lg:text-[11px]", theme.muted2)}>
                  {tenantName || tenantSlug || "Current module"}
                </div>
              </div>

              <div className="max-h-[min(38vh,420px)] overflow-auto pr-1 lg:max-h-[46vh]">
                <div className="space-y-1 px-1 py-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const selected = activeNav === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSwitchPage(item.id, item.label)
                          setMenuOpen(false)
                        }}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-[16px] px-4 py-2 text-left transition-all lg:rounded-[22px] lg:px-4 lg:py-3",
                          selected ? theme.selected : theme.hover
                        )}
                        style={
                          selected && branding?.brandHex
                            ? {
                                background: "rgba(var(--tenant-brand-rgb),0.10)",
                                boxShadow: "0 0 0 1px rgba(var(--tenant-brand-rgb),0.14)",
                              }
                            : undefined
                        }
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                      </button>
                    )
                  })}
                </div>

                <div className={cn("border-t px-2 pb-2.5 pt-3 lg:pb-3", theme.line)}>
                  <div className={cn("mb-2 text-[10px] uppercase tracking-[0.18em] lg:text-[11px]", theme.muted2)}>
                    Platform
                  </div>
                </div>

                <div className="space-y-1 px-1 pb-3">
                  {platformItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.label}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-[16px] px-4 py-2 text-left transition lg:rounded-[22px] lg:px-4 lg:py-3",
                          theme.hover
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        {item.label === "Theme" ? (
                          <ThemeControl
                            themeMode={themeMode}
                            setThemeMode={setThemeMode}
                            customTheme={customTheme}
                            setCustomTheme={setCustomTheme}
                            theme={theme}
                          />
                        ) : (
                          <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {user ? (
                <div className={cn("mt-2.5 border-t px-2 pt-2.5 lg:mt-3 lg:pt-3", theme.line)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-[20px] border p-3 lg:rounded-[22px] lg:p-4",
                      theme.subCard,
                      theme.line
                    )}
                    style={{
                      background: branding?.brandHex
                        ? "linear-gradient(135deg, rgba(var(--tenant-brand-rgb),0.10), rgba(var(--tenant-brand-rgb),0.03))"
                        : undefined,
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold lg:h-11 lg:w-11",
                        theme.card
                      )}
                    >
                      {user.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{user.name}</div>
                      <div className={cn("truncate text-xs", theme.muted)}>{user.role}</div>
                      {tenantSlug ? (
                        <div className={cn("truncate text-[11px]", theme.muted2)}>
                          {tenantName || tenantSlug}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={cn("mt-2.5 space-y-2 border-t px-2 pt-2.5 lg:mt-3 lg:pt-3", theme.line)}>
                <button
                  onClick={() => {
                    onGoModules()
                    setMenuOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[16px] px-4 py-2 text-left transition lg:rounded-[22px] lg:px-4 lg:py-3",
                    theme.hover
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Grid3X3 className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                    <span className="text-sm font-medium">Back to modules</span>
                  </span>
                  <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                </button>

                <button
                  onClick={() => {
                    onLogout()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-[16px] px-4 py-2 text-left text-rose-300 transition hover:bg-rose-500/10 lg:rounded-[22px] lg:px-4 lg:py-3"
                >
                  <span className="flex items-center gap-3">
                    <XCircle className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                    <span className="text-sm font-medium">Log out</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-rose-300/70" />
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
