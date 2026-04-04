"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { modules, navByModule } from "@/data/mock-data"
import { themeMap } from "@/lib/themes"
import { signOut } from "@/lib/supabase/auth"
import HeaderBar from "@/components/header-bar"
import TabBar from "@/components/tab-bar"
import FloatingMenu from "@/components/floating-menu"
import GlobalSearchModal from "@/components/global-search-modal"
import ModuleSelector from "@/components/module-selector"
import ModuleContent from "@/components/module-content"
import DesktopSidebar from "@/components/desktop-sidebar"

const moduleRouteMap = {
  "/itsm": "itsm",
  "/control": "control",
  "/selfservice": "selfservice",
  "/admin": "admin",
  "/analytics": "analytics",
  "/automation": "automation",
}

export default function AppShell({
  initialView = "app",
  forcedModule = "itsm",
  tenantSlug = null,
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [appState, setAppState] = useState(initialView)
  const [currentModule, setCurrentModule] = useState(forcedModule)
  const [activeNav, setActiveNav] = useState("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [themeMode, setThemeMode] = useState("system")
  const [systemTheme, setSystemTheme] = useState("dark")
  const [customTheme, setCustomTheme] = useState("midnight")
  const [navMode, setNavMode] = useState("sidebar")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openTabs, setOpenTabs] = useState([
    { id: "dashboard", pageId: "dashboard", label: "Dashboard", closable: false },
  ])
  const [activeTabId, setActiveTabId] = useState("dashboard")

  const user = { name: "Dan Sutton", initials: "DS", role: "Platform Admin" }
  const navItems = navByModule[currentModule]
  const currentModuleTitle =
    modules.find((module) => module.id === currentModule)?.title || "Workspace"

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
      const firstPage = navByModule[moduleId][0]
      setAppState("app")
      setCurrentModule(moduleId)
      setActiveNav(firstPage.id)
      setOpenTabs([
        { id: firstPage.id, pageId: firstPage.id, label: firstPage.label, closable: false },
      ])
      setActiveTabId(firstPage.id)
    }
  }, [pathname])

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
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const resolvedThemeKey =
    themeMode === "system" ? systemTheme : themeMode === "custom" ? customTheme : themeMode
  const theme = { ...themeMap[resolvedThemeKey], resolved: resolvedThemeKey }

  const tenantBasePath = tenantSlug ? `/tenant/${tenantSlug}` : ""

  import { tenantModulePath, tenantPath } from "@/lib/tenant/paths"

const routeByModule = {
  itsm: tenantModulePath(tenantSlug, "itsm"),
  control: tenantModulePath(tenantSlug, "control"),
  selfservice: tenantModulePath(tenantSlug, "selfservice"),
  admin: tenantModulePath(tenantSlug, "admin"),
  analytics: tenantModulePath(tenantSlug, "analytics"),
  automation: tenantModulePath(tenantSlug, "automation"),
}
  const openModule = (moduleId) => {
    setCurrentModule(moduleId)
    const firstPage = navByModule[moduleId][0]
    setOpenTabs([{ id: firstPage.id, pageId: firstPage.id, label: firstPage.label, closable: false }])
    setActiveTabId(firstPage.id)
    setActiveNav(firstPage.id)
    setAppState("app")
    setMenuOpen(false)
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
    if (tab) setActiveNav(tab.pageId)
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

  const switchPage = (pageId, label) => {
    addNewTab(pageId, label || navItems.find((n) => n.id === pageId)?.label || pageId)
  }

  const goToModules = () => {
    setAppState("modules")
    if (tenantSlug) {
      router.push(`${tenantBasePath}/dashboard`)
    } else {
      router.push(tenantPath(tenantSlug, "dashboard"))
    }
  }

  const goToLogin = async () => {
    try {
      await signOut()
    } catch {
      // still redirect even if signOut throws
    }

    if (tenantSlug) {
      router.push(`${tenantBasePath}/login`)
    } else {
      router.push("/login")
    }
  }

  const desktopContentOffset =
    navMode === "sidebar" ? (sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[280px]") : ""

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${theme.app}`}>
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
        currentModuleTitle={currentModuleTitle}
        theme={theme}
      />

      {appState === "modules" && <ModuleSelector user={user} onEnterModule={openModule} theme={theme} />}

      {appState === "app" && (
        <>
          {navMode === "sidebar" ? (
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
            />
          ) : null}

          <div className={desktopContentOffset}>
            <HeaderBar
              theme={theme}
              currentModuleTitle={currentModuleTitle}
              navItems={navItems}
              activeNav={activeNav}
            />
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
            <main className="px-5 pb-28 pt-6 lg:px-8">
              <ModuleContent moduleId={currentModule} activeNav={activeNav} theme={theme} />
            </main>
          </div>

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
            navMode={navMode}
            user={user}
          />
        </>
      )}
    </div>
  )
}
