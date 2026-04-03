"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/components/shared-ui"

const ARROW_SLOT = 48
const EDGE_FADE_WIDTH = 28
const SCROLL_STEP = 260

export default function TabBar({
  openTabs,
  activeTabId,
  onActivate,
  onClose,
  onAdd,
  navItems,
  currentModuleTitle,
  theme,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const viewportRef = useRef(null)
  const tabRefs = useRef({})
  const timerRef = useRef(null)

  const refreshScrollState = () => {
    const el = viewportRef.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    setIsOverflowing(maxScrollLeft > 8)
    setCanScrollLeft(el.scrollLeft > 6)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 6)
  }

  const scheduleRefresh = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      refreshScrollState()
    }, 220)
  }

  const scrollByAmount = (amount) => {
    const el = viewportRef.current
    if (!el) return

    el.scrollBy({ left: amount, behavior: "smooth" })
    scheduleRefresh()
  }

  const scrollTabIntoView = (tabId) => {
    const tabEl = tabRefs.current[tabId]
    if (!tabEl) return

    tabEl.scrollIntoView({
      behavior: "smooth",
      inline: isDesktop ? "start" : "nearest",
      block: "nearest",
    })

    scheduleRefresh()
  }

  const handleTabClick = (tabId) => {
    onActivate(tabId)
    requestAnimationFrame(() => {
      scrollTabIntoView(tabId)
    })
  }

  useEffect(() => {
    const updateDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    updateDesktop()
    window.addEventListener("resize", updateDesktop)
    return () => window.removeEventListener("resize", updateDesktop)
  }, [])

  useEffect(() => {
    refreshScrollState()

    const el = viewportRef.current
    if (!el) return

    const onScroll = () => refreshScrollState()
    el.addEventListener("scroll", onScroll, { passive: true })

    const ro = new ResizeObserver(() => refreshScrollState())
    ro.observe(el)

    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [openTabs, isDesktop])

  useEffect(() => {
    scrollTabIntoView(activeTabId)
  }, [activeTabId, openTabs, isDesktop])

  const showDesktopArrowSlots = isDesktop && isOverflowing

  return (
    <div className={cn("sticky top-0 z-40 border-b px-4 py-2 backdrop-blur-xl lg:px-6", theme.header)}>
      <div className="relative flex items-center gap-2">
        <div className={cn("hidden shrink-0 lg:block", showDesktopArrowSlots ? "w-12" : "w-0")}>
          <AnimatePresence mode="wait">
            {showDesktopArrowSlots ? (
              canScrollLeft ? (
                <motion.button
                  key="left-arrow"
                  type="button"
                  onClick={() => scrollByAmount(-SCROLL_STEP)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-xl border transition", theme.card, theme.hover)}
                  aria-label="Scroll tabs left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
              ) : (
                <div className="h-10 w-10" />
              )
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative min-w-0 flex-1">
          <AnimatePresence>
            {showDesktopArrowSlots && canScrollLeft ? (
              <motion.div
                key="left-fade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className={cn(
                  "pointer-events-none absolute left-0 top-0 z-10 hidden h-full lg:block",
                  theme.resolved === "light"
                    ? "bg-gradient-to-r from-white/95 to-transparent"
                    : theme.resolved === "emerald"
                      ? "bg-gradient-to-r from-[#041811]/95 to-transparent"
                      : theme.resolved === "midnight"
                        ? "bg-gradient-to-r from-[#06101f]/95 to-transparent"
                        : "bg-gradient-to-r from-slate-950/95 to-transparent"
                )}
                style={{ width: `${EDGE_FADE_WIDTH}px` }}
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showDesktopArrowSlots && canScrollRight ? (
              <motion.div
                key="right-fade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className={cn(
                  "pointer-events-none absolute right-0 top-0 z-10 hidden h-full lg:block",
                  theme.resolved === "light"
                    ? "bg-gradient-to-l from-white/95 to-transparent"
                    : theme.resolved === "emerald"
                      ? "bg-gradient-to-l from-[#041811]/95 to-transparent"
                      : theme.resolved === "midnight"
                        ? "bg-gradient-to-l from-[#06101f]/95 to-transparent"
                        : "bg-gradient-to-l from-slate-950/95 to-transparent"
                )}
                style={{ width: `${EDGE_FADE_WIDTH}px` }}
              />
            ) : null}
          </AnimatePresence>

          <div
            ref={viewportRef}
            className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-proximity px-1 lg:px-2"
          >
            {openTabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current[tab.id] = el
                }}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "group flex shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                  tab.id === activeTabId ? theme.selected : cn(theme.card, theme.hover)
                )}
              >
                <span className="max-w-[160px] truncate">{tab.label}</span>
                {tab.closable ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose(tab.id)
                    }}
                    className="rounded-md p-0.5 opacity-70 transition hover:bg-black/10 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("hidden shrink-0 lg:block", showDesktopArrowSlots ? "w-12" : "w-0")}>
          <AnimatePresence mode="wait">
            {showDesktopArrowSlots ? (
              canScrollRight ? (
                <motion.button
                  key="right-arrow"
                  type="button"
                  onClick={() => scrollByAmount(SCROLL_STEP)}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.16 }}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-xl border transition", theme.card, theme.hover)}
                  aria-label="Scroll tabs right"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              ) : (
                <div className="h-10 w-10" />
              )
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={cn("flex h-10 w-10 items-center justify-center rounded-xl border transition", theme.card, theme.hover)}
            title="Open new tab"
          >
            <Plus className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {pickerOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className={cn("absolute right-0 top-12 z-40 w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40", theme.panel)}
              >
                <div className={cn("mb-2 px-2 text-[11px] uppercase tracking-[0.16em]", theme.muted2)}>
                  {currentModuleTitle} pages
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onAdd(item.id, item.label)
                          setPickerOpen(false)
                        }}
                        className={cn("flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition", theme.hover)}
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

                <div className={cn("my-3 border-t", theme.line)} />

                <div className={cn("mb-2 px-2 text-[11px] uppercase tracking-[0.16em]", theme.muted2)}>
                  Recent / common
                </div>

                <div className="space-y-1">
                  {navItems.slice(0, 6).map((item) => (
                    <button
                      key={`recent-${item.id}`}
                      onClick={() => {
                        onAdd(item.id, item.label)
                        setPickerOpen(false)
                      }}
                      className={cn("flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition", theme.hover)}
                    >
                      <span className="text-sm">{item.label}</span>
                      <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
