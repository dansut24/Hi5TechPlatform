"use client"

import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, ChevronRight, Grid3X3, Menu, Search, Sparkles, UserCircle2, Bell, LayoutDashboard, Settings, X, XCircle } from "lucide-react"
import { cn } from "@/components/shared-ui"

const platformItems = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Account Settings", icon: Settings },
  { label: "Theme", icon: Sparkles },
  { label: "Notifications", icon: Bell },
  { label: "Support", icon: UserCircle2 },
  { label: "Docs", icon: BookOpen },
]

function ThemeControl({ themeMode, setThemeMode, customTheme, setCustomTheme, theme }) {
  const themeButton = (key, icon) => (
    <button onClick={(e) => { e.stopPropagation(); setThemeMode(key) }} className={cn("flex h-8 w-8 items-center justify-center rounded-full transition", themeMode === key ? theme.soft : theme.muted)}>
      {icon}
    </button>
  )

  return (
    <span className="ml-3 flex items-center gap-2">
      <span className={cn("inline-flex items-center rounded-full border p-1", theme.card)}>
        {themeButton("light", <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>)}
        {themeButton("dark", <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>)}
        {themeButton("system", <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 8h6" /></svg>)}
        {themeButton("custom", <Sparkles className="h-4 w-4" />)}
      </span>
      {themeMode === "custom" ? (
        <span className={cn("inline-flex items-center rounded-full border p-1", theme.card)}>
          <button onClick={(e) => { e.stopPropagation(); setCustomTheme("midnight") }} className={cn("h-7 rounded-full px-3 text-[11px] transition", customTheme === "midnight" ? theme.soft : theme.muted)}>Midnight</button>
          <button onClick={(e) => { e.stopPropagation(); setCustomTheme("emerald") }} className={cn("h-7 rounded-full px-3 text-[11px] transition", customTheme === "emerald" ? theme.soft : theme.muted)}>Emerald</button>
        </span>
      ) : null}
    </span>
  )
}

export default function FloatingMenu({ navItems, activeNav, onSwitchPage, onGoModules, onLogout, menuOpen, setMenuOpen, onOpenSearch, themeMode, setThemeMode, customTheme, setCustomTheme, theme, navMode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("fixed bottom-6 left-1/2 z-50 -translate-x-1/2", navMode === "sidebar" ? "lg:hidden" : "")}
      >
        <div className={cn("flex items-center gap-2 rounded-[26px] border px-2.5 py-2 shadow-2xl backdrop-blur-2xl", theme.floating)}>
          <button className={cn("flex h-10 items-center gap-2 rounded-[20px] px-3 text-sm transition", theme.hover)} onClick={onOpenSearch}>
            <Search className="h-4 w-4" />
            <span>Search...</span>
          </button>
          <div className={cn("h-7 w-px", theme.resolved === "light" ? "bg-slate-200" : theme.resolved === "emerald" ? "bg-emerald-400/10" : theme.resolved === "midnight" ? "bg-cyan-500/10" : "bg-white/10")} />
          <button className={cn("flex h-10 w-10 items-center justify-center rounded-[18px] transition", theme.hover)} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuOpen ? (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={cn("absolute bottom-24 left-1/2 z-40 w-[420px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-[32px] border p-3 shadow-2xl shadow-black/50", theme.panel)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn("border-b px-2 pb-3 pt-2", theme.line)}>
                <div className={cn("mb-2 text-[11px] uppercase tracking-[0.18em]", theme.muted2)}>Current module</div>
              </div>
              <div className="max-h-[46vh] overflow-auto pr-1">
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
                        className={cn("group flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition-all", selected ? theme.selected : theme.hover)}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                      </button>
                    )
                  })}
                </div>

                <div className={cn("border-t px-2 pb-3 pt-3", theme.line)}>
                  <div className={cn("mb-2 text-[11px] uppercase tracking-[0.18em]", theme.muted2)}>Platform</div>
                </div>
                <div className="space-y-1 px-1 pb-3">
                  {platformItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button key={item.label} className={cn("group flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition", theme.hover)}>
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        {item.label === "Theme" ? (
                          <ThemeControl themeMode={themeMode} setThemeMode={setThemeMode} customTheme={customTheme} setCustomTheme={setCustomTheme} theme={theme} />
                        ) : (
                          <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className={cn("mt-3 space-y-2 border-t px-2 pt-3", theme.line)}>
                <button onClick={() => { onGoModules(); setMenuOpen(false) }} className={cn("flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition", theme.hover)}>
                  <span className="flex items-center gap-3"><Grid3X3 className="h-5 w-5" /><span className="text-sm font-medium">Back to modules</span></span>
                  <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                </button>
                <button onClick={() => { onLogout(); setMenuOpen(false) }} className="flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-rose-300 transition hover:bg-rose-500/10">
                  <span className="flex items-center gap-3"><XCircle className="h-5 w-5" /><span className="text-sm font-medium">Log out</span></span>
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
