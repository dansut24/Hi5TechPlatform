"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/components/shared-ui"

export default function TabBar({ openTabs, activeTabId, onActivate, onClose, onAdd, navItems, currentModuleTitle, theme }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className={cn("sticky top-0 z-40 border-b px-4 py-2 backdrop-blur-xl lg:px-6", theme.header)}>
      <div className="flex items-center gap-2 overflow-x-auto">
        {openTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onActivate(tab.id)}
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
                className={cn("absolute left-0 top-12 z-40 w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40", theme.panel)}
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
