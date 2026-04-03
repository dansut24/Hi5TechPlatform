"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/components/shared-ui"

const DESKTOP_BUTTON_SLOT = 48
const EDGE_FADE_WIDTH = 32
const DESKTOP_SAFE_GAP = 8

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
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const scrollRef = useRef(null)
  const tabRefs = useRef({})
  const refreshTimerRef = useRef(null)

  const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 1024

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const overflowing = maxScrollLeft > 8

    setIsOverflowing(overflowing)
    setCanScrollLeft(el.scrollLeft > 6)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 6)
  }

  const scheduleRefresh = () => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current)
    }

    refreshTimerRef.current = window.setTimeout(() => {
      updateScrollState()
    }, 220)
  }

  const scrollTabsBy = (amount) => {
    const el = scrollRef.current
    if (!el) return

    el.scrollBy({
      left: amount,
      behavior: "smooth",
    })

    scheduleRefresh()
  }

  const scrollTabIntoViewDesktopSafe = (tabId) => {
    const container = scrollRef.current
    const tabEl = tabRefs.current[tabId]
    if (!container || !tabEl) return

    if (!isDesktop()) {
      tabEl.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      })
      scheduleRefresh()
      return
    }

    const leftInset = isOverflowing ? DESKTOP_BUTTON_SLOT : 0
    const rightInset = isOverflowing ? DESKTOP_BUTTON_SLOT : 0

    const tabLeft = tabEl.offsetLeft
    const tabRight = tabLeft + tabEl.offsetWidth

    const visibleLeft = container.scrollLeft + leftInset
    const visibleRight = container.scrollLeft + container.clientWidth - rightInset

    let nextScrollLeft = container.scrollLeft

    if (tabLeft < visibleLeft) {
      nextScrollLeft = Math.max(0, tabLeft - leftInset - DESKTOP_SAFE_GAP)
    } else if (tabRight > visibleRight) {
      nextScrollLeft = Math.min(
        container.scrollWidth - container.clientWidth,
        tabRight - container.clientWidth + rightInset + DESKTOP_SAFE_GAP
      )
    }

    if (Math.abs(nextScrollLeft - container.scrollLeft) > 1) {
      container.scrollTo({
        left: nextScrollLeft,
        behavior: "smooth",
      })
    }

    scheduleRefresh()
  }

  const handleTabClick = (tabId) => {
    onActivate(tabId)

    requestAnimationFrame(() => {
      scrollTabIntoViewDesktopSafe(tabId)
    })
  }

  useEffect(() => {
    updateScrollState()

    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => updateScrollState()
    el.addEventListener("scroll", handleScroll, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState()
    })

    resizeObserver.observe(el)

    const handleResize = () => updateScrollState()
    window.addEventListener("resize", handleResize)

    return () => {
      el.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
      }
    }
  }, [openTabs])

  useEffect(() => {
    scrollTabIntoViewDesktopSafe(activeTabId)
  }, [activeTabId, openTabs])

  const showDesktopScrollSlots = isDesktop() && isOverflowing

  return (
    <div className={cn("sticky top-0 z-40 border-b px-4 py-2 backdrop-blur-xl lg:px-6", theme.header)}>
      <div className="relative flex items-center gap-2">
        <div className={cn("hidden shrink-0 lg:block", showDesktopScrollSlots ? "w-12" : "w-0")}>
          {showDesktopScrollSlots ? (
            <AnimatePresence mode="wait">
              {canScrollLeft ? (
                <motion.button
                  key="left-enabled"
                  type="button"
                  onClick={() => scrollTabsBy(-220)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                    theme.card,
                    theme.hover
                  )}
                  aria-label="Scroll tabs left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
              ) : (
                <div className="h-10 w-10" />
              )}
            </AnimatePresence>
          ) : null}
        </div>

        <div className="relative min-w-0 flex-1">
          <AnimatePresence>
            {showDesktopScrollSlots && canScrollLeft ? (
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
            {showDesktopScrollSlots && canScrollRight ? (
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
            ref={scrollRef}
            className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto scroll-smooth px-1"
          >
            {openTabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current[tab.id] = el
                }}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
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

        <div className={cn("hidden shrink-0 lg:block", showDesktopScrollSlots ? "w-12" : "w-0")}>
          {showDesktopScrollSlots ? (
            <AnimatePresence mode="wait">
              {canScrollRight ? (
                <motion.button
                  key="right-enabled"
                  type="button"
                  onClick={() => scrollTabsBy(220)}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                    theme.card,
                    theme.hover
                  )}
                  aria-label="Scroll tabs right"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              ) : (
                <div className="h-10 w-10" />
              )}
            </AnimatePresence>
          ) : null}
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
