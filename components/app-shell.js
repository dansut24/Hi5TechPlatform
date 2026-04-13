"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X } from "lucide-react"
import { modules, navByModule } from "@/data/mock-data"
import { themeMap } from "@/lib/themes"
import { signOut } from "@/lib/supabase/auth"
import { tenantDashboardPath, tenantLoginPath, tenantModulePath, tenantPath } from "@/lib/tenant/paths"
import useIdleTimeout from "@/lib/auth/use-idle-timeout"
import HeaderBar from "@/components/header-bar"
import TabBar from "@/components/tab-bar"
import FloatingMenu from "@/components/floating-menu"
import GlobalSearchModal from "@/components/global-search-modal"
import ModuleSelector from "@/components/module-selector"
import ModuleContent from "@/components/module-content"
import DesktopSidebar from "@/components/desktop-sidebar"
import SessionTimeoutModal from "@/components/auth/session-timeout-modal"
import { cn } from "@/components/shared-ui"

const moduleRouteMap = {
  "/itsm": "itsm",
  "/control": "control",
  "/selfservice": "selfservice",
  "/admin": "admin",
  "/analytics": "analytics",
  "/automation": "automation",
}

const DEFAULT_SESSION_SETTINGS = {
  idle_timeout_minutes: 30,
  warning_minutes_before: 5,
  remember_device_days: 30,
  require_2fa_for_admin: false,
  require_2fa_for_control: false,
}

function getRouteForNav({ tenantSlug, currentModule, pageId }) {
  if (!tenantSlug) return null

  if (currentModule === "admin") {
    if (pageId === "branding") return tenantPath(tenantSlug, "/admin/branding")
  }

  return null
}

export default function AppShell({
  initialView = "app",
  forcedModule = "itsm",
  initialNav = "dashboard",
  tenantSlug = null,
  tenantName = "",
  branding = null,
  tenantData = null,
  allowedModuleIds = [],
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [appState, setAppState] = useState(initialView)
  const [currentModule, setCurrentModule] = useState(forcedModule)
  const [activeNav, setActiveNav] = useState(initialNav)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [themeMode, setThemeMode] = useState("system")
  const [systemTheme, setSystemTheme] = useState("dark")
  const [customTheme, setCustomTheme] = useState("midnight")
  const [navMode, setNavMode] = useState("sidebar")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionSettings, setSessionSettings] = useState(DEFAULT_SESSION_SETTINGS)
  const [sessionSettingsLoaded, setSessionSettingsLoaded] = useState(false)
  const [selfServiceMobileMenuOpen, setSelfServiceMobileMenuOpen] = useState(false)

  const [openTabs, setOpenTabs] = useState([
    {
      id: initialNav,
      pageId: initialNav,
      label:
        navByModule[forcedModule]?.find((item) => item.id === initialNav)?.label || "Dashboard",
      closable: false,
    },
  ])
  const [activeTabId, setActiveTabId] = useState(initialNav)

  const user = { name: "Dan Sutton", initials: "DS", role: "Platform Admin" }
  const navItems = navByModule[currentModule]
  const currentModuleTitle =
    modules.find((module) => module.id === currentModule)?.title || "Workspace"

  const isSelfService = currentModule === "selfservice"
  const effectiveNavMode = isSelfService ? "sidebar" : navMode
  const showFloatingMenu = !isSelfService
  const showTabBar = !isSelfService

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedNavMode = window.localStorage.getItem("hi5tech-nav-mode")
    const savedSidebarCollapsed = window.localStorage.getItem("hi5tech-sidebar-collapsed")
    if (savedNavMode === "floating" || savedNavMode === "sidebar") setNavMode(savedNavMode)
    if (savedSidebarCollapsed === "true") setSidebarCollapsed(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("hi5tech-nav-mode", navMode)
  }, [navMode])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("hi5tech-sidebar-collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    if (pathname === "/select-module") {
      setAppState("modules")
      return
    }

    if (moduleRouteMap[pathname]) {
      const moduleId = moduleRouteMap[pathname]

      if (allowedModuleIds.length && !allowedModuleIds.includes(moduleId)) {
        return
      }

      const firstPage = navByModule[moduleId][0]
      setAppState("app")
      setCurrentModule(moduleId)
      setActiveNav(firstPage.id)
      setOpenTabs([
        { id: firstPage.id, pageId: firstPage.id, label: firstPage.label, closable: false },
      ])
      setActiveTabId(firstPage.id)
      setSelfServiceMobileMenuOpen(false)
      return
    }

    if (tenantSlug && pathname === `/tenant/${tenantSlug}/admin/branding`) {
      if (allowedModuleIds.length && !allowedModuleIds.includes("admin")) {
        return
      }

      setAppState("app")
      setCurrentModule("admin")
      setActiveNav("branding")
      setOpenTabs([
        { id: "branding", pageId: "branding", label: "Branding", closable: false },
      ])
      setActiveTabId("branding")
    }
  }, [pathname, tenantSlug, allowedModuleIds])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setSystemTheme(media.matches ? "dark" : "light")
    update()
    if (media.addEventListener) media.addEventListener("change", update)
    else media.addListener(update)
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update)
      else media.removeListener(update)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setMenuOpen(false)
        setSelfServiceMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!tenantSlug) return

    let active = true

    async function loadSessionSettings() {
      try {
        const res = await fetch(`/api/tenant/${tenantSlug}/settings/session`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!active) return
        if (!res.ok) return

        setSessionSettings({
          ...DEFAULT_SESSION_SETTINGS,
          ...(json.settings || {}),
        })
      } catch {
      } finally {
        if (active) setSessionSettingsLoaded(true)
      }
    }

    loadSessionSettings()

    return () => {
      active = false
    }
  }, [tenantSlug])

  const resolvedThemeKey =
    themeMode === "system" ? systemTheme : themeMode === "custom" ? customTheme : themeMode
  const theme = { ...themeMap[resolvedThemeKey], resolved: resolvedThemeKey }

  const routeByModule = {
    itsm: tenantModulePath(tenantSlug, "itsm"),
    control: tenantModulePath(tenantSlug, "control"),
    selfservice: tenantModulePath(tenantSlug, "selfservice"),
    admin: tenantModulePath(tenantSlug, "admin"),
    analytics: tenantModulePath(tenantSlug, "analytics"),
    automation: tenantModulePath(tenantSlug, "automation"),
  }

  const openModule = (moduleId) => {
    if (allowedModuleIds.length && !allowedModuleIds.includes(moduleId)) {
      return
    }

    setCurrentModule(moduleId)
    const firstPage = navByModule[moduleId][0]
    setOpenTabs([{ id: firstPage.id, pageId: firstPage.id, label: firstPage.label, closable: false }])
    setActiveTabId(firstPage.id)
    setActiveNav(firstPage.id)
    setAppState("app")
    setMenuOpen(false)
    setSelfServiceMobileMenuOpen(false)
    router.push(routeByModule[moduleId])
  }

  const addNewTab = (pageId, label) => {
    setOpenTabs((prev) => {
      const existing = prev.find((tab) => tab.pageId === pageId)
      if (existing) {
        setActiveTabId(existing.id)
        setActiveNav(existing.pageId)
        return prev
      }
      const id = `${pageId}-${Date.now()}`
      const tab = { id, pageId, label, closable: true }
      setActiveTabId(id)
      setActiveNav(pageId)
      return [...prev, tab]
    })
  }

  const activateTab = (tabId) => {
    setActiveTabId(tabId)
    const tab = openTabs.find((t) => t.id === tabId)
    if (tab) {
      setActiveNav(tab.pageId)
      const navRoute = getRouteForNav({
        tenantSlug,
        currentModule,
        pageId: tab.pageId,
      })
      if (navRoute) router.push(navRoute)
    }
  }

  const closeTab = (tabId) => {
    setOpenTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== tabId)
      if (!next.length) return prev
      if (activeTabId === tabId) {
        const fallback = next[next.length - 1]
        setActiveTabId(fallback.id)
        setActiveNav(fallback.pageId)
      }
      return next
    })
  }

  const switchPage = useCallback((pageId, label) => {
    const navRoute = getRouteForNav({
      tenantSlug,
      currentModule,
      pageId,
    })

    if (navRoute) {
      setActiveNav(pageId)
      setOpenTabs([{ id: pageId, pageId, label: label || pageId, closable: false }])
      setActiveTabId(pageId)
      setSelfServiceMobileMenuOpen(false)
      router.push(navRoute)
      return
    }

    addNewTab(pageId, label || navItems.find((n) => n.id === pageId)?.label || pageId)
    setSelfServiceMobileMenuOpen(false)
  }, [tenantSlug, currentModule, navItems, router])

  const goToModules = () => {
    setAppState("modules")
    router.push(tenantDashboardPath(tenantSlug))
  }

  const goToLogin = useCallback(async () => {
    try {
      await signOut()
    } catch {}

    router.push(tenantLoginPath(tenantSlug))
  }, [router, tenantSlug])

  const desktopContentOffset = useMemo(() => {
    if (isSelfService) return ""
    return effectiveNavMode === "sidebar"
      ? sidebarCollapsed
        ? "lg:pl-[84px]"
        : "lg:pl-[280px]"
      : ""
  }, [isSelfService, effectiveNavMode, sidebarCollapsed])

  const effectiveIdleTimeoutMinutes = useMemo(() => {
    if (currentModule === "control") {
      return Math.min(sessionSettings.idle_timeout_minutes, 15)
    }

    if (currentModule === "admin") {
      return Math.min(sessionSettings.idle_timeout_minutes, 20)
    }

    return sessionSettings.idle_timeout_minutes
  }, [currentModule, sessionSettings.idle_timeout_minutes])

  const idleTimeoutMs = effectiveIdleTimeoutMinutes * 60 * 1000
  const warningDurationMs = sessionSettings.warning_minutes_before * 60 * 1000

  const { warningOpen, secondsRemaining, staySignedIn } = useIdleTimeout({
    enabled: Boolean(sessionSettingsLoaded && tenantSlug && appState === "app"),
    idleTimeoutMs,
    warningDurationMs,
    onWarn: () => {},
    onTimeout: goToLogin,
  })

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${theme.app}`}
      style={branding?.cssVars || {}}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: branding?.brandHex
            ? "radial-gradient(circle at top left, rgba(var(--tenant-brand-rgb),0.18), transparent 28%), radial-gradient(circle at top right, rgba(var(--tenant-brand-rgb),0.10), transparent 24%)"
            : undefined,
        }}
      />

      <div className="relative z-10">
        <GlobalSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          query={searchQuery}
          setQuery={setSearchQuery}
          currentModuleTitle={currentModuleTitle}
          theme={theme}
        />

        <SessionTimeoutModal
          open={warningOpen}
          secondsRemaining={secondsRemaining}
          onStaySignedIn={staySignedIn}
          theme={theme}
        />

        {appState === "modules" && (
          <ModuleSelector
            user={user}
            onEnterModule={openModule}
            theme={theme}
            tenantSlug={tenantSlug}
            branding={branding}
            tenantName={tenantName}
            allowedModuleIds={allowedModuleIds}
          />
        )}

        {appState === "app" && (
          <>
            {!isSelfService && effectiveNavMode === "sidebar" ? (
              <DesktopSidebar
                user={user}
                navItems={navItems}
                activeNav={activeNav}
                onSwitchPage={switchPage}
                onGoModules={goToModules}
                onLogout={goToLogin}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                theme={theme}
                tenantSlug={tenantSlug}
                branding={branding}
                tenantName={tenantName}
              />
            ) : null}

            {isSelfService && selfServiceMobileMenuOpen ? (
              <div className="fixed inset-0 z-[110] lg:hidden">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setSelfServiceMobileMenuOpen(false)}
                />
                <div className={cn("absolute inset-y-0 left-0 w-[86vw] max-w-[320px] border-r p-4 shadow-2xl", theme.panel)}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">{tenantName || tenantSlug}</div>
                    <button
                      onClick={() => setSelfServiceMobileMenuOpen(false)}
                      className={cn("flex h-9 w-9 items-center justify-center rounded-2xl border", theme.card, theme.hover)}
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const selected = activeNav === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => switchPage(item.id, item.label)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                            selected ? theme.selected : theme.hover
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className={cn("mt-4 border-t pt-4", theme.line)}>
                    <button
                      onClick={() => {
                        setSelfServiceMobileMenuOpen(false)
                        goToModules()
                      }}
                      className={cn("mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition", theme.hover)}
                    >
                      <span className="text-sm font-medium">Back to modules</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelfServiceMobileMenuOpen(false)
                        goToLogin()
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <span className="text-sm font-medium">Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className={desktopContentOffset}>
              <HeaderBar
                theme={theme}
                currentModuleTitle={currentModuleTitle}
                navItems={navItems}
                activeNav={activeNav}
                branding={branding}
                tenantName={tenantName}
                tenantSlug={tenantSlug}
                moduleId={currentModule}
                showMobileMenuButton={isSelfService}
                onOpenMobileMenu={() => setSelfServiceMobileMenuOpen(true)}
                showMobileSearchButton={isSelfService}
                onOpenSearch={() => setSearchOpen(true)}
              />

              {showTabBar ? (
                <TabBar
                  openTabs={openTabs}
                  activeTabId={activeTabId}
                  onActivate={activateTab}
                  onClose={closeTab}
                  onAdd={addNewTab}
                  navItems={navItems}
                  currentModuleTitle={currentModuleTitle}
                  theme={theme}
                />
              ) : null}

              <main className={isSelfService ? "px-5 pb-10 pt-6 lg:px-8" : "px-5 pb-28 pt-6 lg:px-8"}>
                <div
                  className="rounded-[30px]"
                  style={{
                    boxShadow: branding?.brandHex
                      ? "0 0 0 1px rgba(var(--tenant-brand-rgb),0.06), 0 18px 50px rgba(0,0,0,0.08)"
                      : undefined,
                  }}
                >
                  <ModuleContent
                    moduleId={currentModule}
                    activeNav={activeNav}
                    theme={theme}
                    tenantSlug={tenantSlug}
                    tenantData={tenantData}
                    onNavigate={switchPage}
                  />
                </div>
              </main>
            </div>

            {showFloatingMenu ? (
              <FloatingMenu
                navItems={navItems}
                activeNav={activeNav}
                onSwitchPage={switchPage}
                onGoModules={goToModules}
                onLogout={goToLogin}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onOpenSearch={() => {
                  setMenuOpen(false)
                  setSearchOpen(true)
                }}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                customTheme={customTheme}
                setCustomTheme={setCustomTheme}
                theme={theme}
                navMode={effectiveNavMode}
                user={user}
                tenantSlug={tenantSlug}
                branding={branding}
                tenantName={tenantName}
                moduleId={currentModule}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
