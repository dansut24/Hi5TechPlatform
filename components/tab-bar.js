"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/components/shared-ui"

function TabButton({
  tab,
  active,
  onActivate,
  onClose,
  showClose = true,
  theme,
  branding,
}) {
  return (
    <button
      onClick={() => onActivate(tab.id)}
      className={cn(
        "group relative flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
        active ? theme.selected : cn(theme.card, theme.hover)
      )}
      style={
        active && branding?.brandHex
          ? {
              background: "rgba(var(--tenant-brand-rgb),0.10)",
              borderColor: "rgba(var(--tenant-brand-rgb),0.20)",
              boxShadow: "0 0 0 1px rgba(var(--tenant-brand-rgb),0.08), 0 0 18px rgba(var(--tenant-brand-rgb),0.08)",
            }
          : undefined
      }
    >
      {active ? (
        <span
          className="absolute inset-x-3 top-0 h-[2px] rounded-full"
          style={{
            background: branding?.brandHex
              ? "linear-gradient(90deg, rgba(var(--tenant-brand-rgb),0.55), rgba(var(--tenant-brand-rgb),1), rgba(var(--tenant-brand-rgb),0.55))"
              : undefined,
          }}
        />
      ) : null}

      <span className="truncate">{tab.label}</span>

      {showClose && tab.closable ? (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onClose(tab.id)
          }}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full transition",
            theme.hover
          )}
        >
          <X className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  )
}

export default function TabBar({
  openTabs,
  activeTabId,
  onActivate,
  onClose,
  onAdd,
  navItems,
  currentModuleTitle,
  theme,
  branding = null,
}) {
  const scrollRef = useRef(null)
  const [showArrows, setShowArrows] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const addableItems = useMemo(() => {
    const openPageIds = new Set(openTabs.map((tab) => tab.pageId))
    return navItems.filter((item) => !openPageIds.has(item.id))
  }, [navItems, openTabs])

  const syncScrollState = () => {
    const el = scrollRef.current
    if (!el) return

    const maxScrollLeft = el.scrollWidth - el.clientWidth
    setShowArrows(el.scrollWidth > el.clientWidth + 8)
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 4)
  }

  useEffect(() => {
    syncScrollState()
    const el = scrollRef.current
    if (!el) return

    el.addEventListener("scroll", syncScrollState, { passive: true })
    window.addEventListener("resize", syncScrollState)

    return () => {
      el.removeEventListener("scroll", syncScrollState)
      window.removeEventListener("resize", syncScrollState)
    }
  }, [])

  useEffect(() => {
    syncScrollState()

    const el = scrollRef.current
    if (!el) return

    const activeIndex = openTabs.findIndex((tab) => tab.id === activeTabId)
    if (activeIndex === -1) return

    const activeEl = el.querySelector(`[data-tab-id="${activeTabId}"]`)
    if (!activeEl) return

    const tabRect = activeEl.getBoundingClientRect()
    const containerRect = el.getBoundingClientRect()

    if (tabRect.left < containerRect.left + 12) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
    } else if (tabRect.right > containerRect.right - 12) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" })
    }
  }, [activeTabId, openTabs])

  const scrollTabs = (direction) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    })
  }

  return (
    <div
      className={cn("sticky z-40 border-b backdrop-blur-xl", theme.header)}
      style={{
        top: "var(--header-height)",
        background: branding?.brandHex
          ? `linear-gradient(180deg, rgba(var(--tenant-brand-rgb),0.08), rgba(var(--tenant-brand-rgb),0.02))`
          : undefined,
        borderColor: branding?.brandHex
          ? "rgba(var(--tenant-brand-rgb),0.10)"
          : undefined,
      }}
    >
      <div className="relative flex items-center gap-2 px-4 py-2 lg:px-6">
        {showArrows ? (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10"
            style={{
              background: theme.resolved === "light"
                ? "linear-gradient(90deg, rgba(255,255,255,0.92), rgba(255,255,255,0))"
                : "linear-gradient(90deg, rgba(11,13,18,0.92), rgba(11,13,18,0))",
            }}
          />
        ) : null}

        {showArrows ? (
          <button
            onClick={() => scrollTabs("left")}
            className={cn(
              "relative z-20 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition md:flex",
              theme.card,
              theme.hover,
              !canScrollLeft ? "pointer-events-none opacity-35" : ""
            )}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-smooth"
        >
          {openTabs.map((tab) => (
            <div key={tab.id} data-tab-id={tab.id}>
              <TabButton
                tab={tab}
                active={tab.id === activeTabId}
                onActivate={onActivate}
                onClose={onClose}
                theme={theme}
                branding={branding}
              />
            </div>
          ))}

          {addableItems.length ? (
            <div className="shrink-0">
              <button
                onClick={() => onAdd(addableItems[0].id, addableItems[0].label)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition",
                  theme.card,
                  theme.hover
                )}
                style={
                  branding?.brandHex
                    ? {
                        borderColor: "rgba(var(--tenant-brand-rgb),0.16)",
                      }
                    : undefined
                }
              >
                <Plus
                  className="h-4 w-4"
                  style={{ color: branding?.brandHex || undefined }}
                />
                <span className="hidden sm:inline">Add tab</span>
              </button>
            </div>
          ) : null}
        </div>

        {showArrows ? (
          <button
            onClick={() => scrollTabs("right")}
            className={cn(
              "relative z-20 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition md:flex",
              theme.card,
              theme.hover,
              !canScrollRight ? "pointer-events-none opacity-35" : ""
            )}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}

        {showArrows ? (
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10"
            style={{
              background: theme.resolved === "light"
                ? "linear-gradient(270deg, rgba(255,255,255,0.92), rgba(255,255,255,0))"
                : "linear-gradient(270deg, rgba(11,13,18,0.92), rgba(11,13,18,0))",
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
