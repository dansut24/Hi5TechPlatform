"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { modules, navByModule } from "@/data/mock-data"
import { themeMap } from "@/lib/themes"
import HeaderBar from "@/components/header-bar"
import TabBar from "@/components/tab-bar"
import FloatingMenu from "@/components/floating-menu"
import GlobalSearchModal from "@/components/global-search-modal"
import ModuleSelector from "@/components/module-selector"
import ModuleContent from "@/components/module-content"

const moduleRouteMap = {
  "/itsm": "itsm",
  "/control": "control",
  "/selfservice": "selfservice",
  "/admin": "admin",
  "/analytics": "analytics",
  "/automation": "automation",
}

const routeByModule = {
  itsm: "/itsm",
  control: "/control",
  selfservice: "/selfservice",
  admin: "/admin",
  analytics: "/analytics",
  automation: "/automation",
}

export default function AppShell({ initialView = "app", forcedModule = "itsm" }) {
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
  const [openTabs, setOpenTabs] = useState([{ id: "dashboard", pageId: "dashboard", label: "Dashboard", closable: false }])
  const [activeTabId, setActiveTabId] = useState("dashboard")

  const user = { name: "Dan Sutton", initials: "DS", role: "Platform Admin" }
  const navItems = navByModule[currentModule]
  const currentModuleTitle = modules.find((module) => module.id === currentModule)?.title || "Workspace"

  useEffect(() => {
    if (pathname === "/login") {
      setAppState("login")
      return
    }
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
      setOpenTabs([{ id: firstPage.id, pageId: firstPage.id, label: firstPage.label, closable: false }])
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

  const resolvedThemeKey = themeMode === "system" ? systemTheme : themeMode === "custom" ? customTheme : themeMode
  const theme = { ...themeMap[resolvedThemeKey], resolved: resolvedThemeKey }

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
    router.push("/select-module")
  }

  const goToLogin = () => {
    setAppState("login")
    router.push("/login")
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.app}`}>
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
        currentModuleTitle={currentModuleTitle}
        theme={theme}
      />

      {appState === "login" && (
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className={`rounded-[28px] border shadow-2xl backdrop-blur-2xl overflow-hidden ${theme.card}`}>
              <div className="relative h-full min-h-[360px] overflow-hidden p-8 lg:p-10">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${theme.card}`}>
                      <span className="text-lg font-semibold">H</span>
                    </div>
                    <div>
                      <div className={`text-sm ${theme.muted}`}>Enterprise Workspace</div>
                      <div className="text-xl font-semibold tracking-tight">Hi5Tech Platform</div>
                    </div>
                  </div>
                  <div className="mt-12 max-w-xl">
                    <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${theme.card} ${theme.muted}`}>Unified operations</div>
                    <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">Run service, support, devices, and self-service from one platform.</h1>
                    <p className={`mt-4 text-base lg:text-lg ${theme.muted}`}>A modern multi-module workspace for ITSM, RMM, asset management, automation, analytics, and end-user support.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`rounded-[28px] border shadow-2xl backdrop-blur-2xl p-6 lg:p-8 ${theme.card}`}>
              <div className="text-2xl font-semibold">Sign in</div>
              <div className={`mt-1 text-sm ${theme.muted}`}>Access your tenant workspace and launch the right module.</div>
              <div className="mt-6 space-y-4">
                <input className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`} placeholder="dan@hi5tech.co.uk" />
                <input type="password" className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`} placeholder="••••••••••••" />
                <button onClick={() => router.push("/select-module")} className={theme.resolved === "light" ? "w-full rounded-2xl bg-slate-950 px-4 py-3 text-white" : "w-full rounded-2xl bg-white px-4 py-3 text-slate-950"}>
                  Sign in to workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {appState === "modules" && <ModuleSelector user={user} onEnterModule={openModule} theme={theme} />}

      {appState === "app" && (
        <>
          <HeaderBar
            user={user}
            onGoModules={goToModules}
            onLogout={goToLogin}
            theme={theme}
            currentModuleTitle={currentModuleTitle}
            navItems={navItems}
            activeNav={activeNav}
            onSwitchPage={switchPage}
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
          <FloatingMenu
            navItems={navItems}
            activeNav={activeNav}
            onSwitchPage={switchPage}
            user={user}
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
          />
        </>
      )}
    </div>
  )
}
