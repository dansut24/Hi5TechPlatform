"use client"

import { useMemo } from "react"
import { Sparkles } from "lucide-react"
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

export default function HeaderBar({
  theme,
  currentModuleTitle,
  navItems,
  activeNav,
}) {
  return (
    <div
      className={cn("relative z-50 border-b backdrop-blur-xl", theme.header)}
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex h-full items-center gap-3 px-4 py-2 lg:px-6 lg:py-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border lg:h-9 lg:w-9", theme.card)}>
          <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
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
    </div>
  )
}
