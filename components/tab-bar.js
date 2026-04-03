"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import { cn } from "@/components/shared-ui"

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

  const activeIndex = useMemo(() => {
    const index = openTabs.findIndex((tab) => tab.id === activeTabId)
    return index >= 0 ? index : 0
  }, [openTabs, activeTabId])

  const muiTabTextColor =
    theme.resolved === "light" ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.9)"

  const muiTabMutedColor =
    theme.resolved === "light" ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.65)"

  const muiIndicatorColor =
    theme.resolved === "light" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)"

  return (
    <div className={cn("sticky top-0 z-40 border-b px-4 py-2 backdrop-blur-xl lg:px-6", theme.header)}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Tabs
            value={activeIndex}
            onChange={(_, newValue) => {
              const tab = openTabs[newValue]
              if (tab) onActivate(tab.id)
            }}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            aria-label={`${currentModuleTitle} tabs`}
            slotProps={{
              scrollButtons: {
                className: cn(
                  "rounded-xl border transition !mx-1",
                  theme.card,
                  theme.hover
                ),
              },
            }}
            sx={{
              minHeight: 40,
              "& .MuiTabs-flexContainer": {
                gap: "8px",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTabs-scrollButtons": {
                width: 40,
                height: 40,
                flexShrink: 0,
                opacity: 1,
                color: muiTabMutedColor,
              },
              "& .Mui-disabled": {
                opacity: 0.35,
              },
              "& .MuiTabs-scroller": {
                overflowY: "hidden !important",
              },
              "& .MuiTabs-scrollableX": {
                scrollbarWidth: "none",
              },
              "& .MuiTabs-scrollableX::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {openTabs.map((tab) => {
              const selected = tab.id === activeTabId

              return (
                <Tab
                  key={tab.id}
                  disableRipple
                  label={
                    <span className="flex items-center gap-2">
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
                    </span>
                  }
                  sx={{
                    minHeight: 40,
                    height: 40,
                    padding: 0,
                    minWidth: 0,
                    borderRadius: "12px",
                    textTransform: "none",
                    justifyContent: "flex-start",
                    color: selected ? muiTabTextColor : muiTabMutedColor,
                    border: "1px solid",
                    borderColor:
                      theme.resolved === "light"
                        ? "rgba(148,163,184,0.28)"
                        : "rgba(255,255,255,0.10)",
                    backgroundColor: selected
                      ? theme.resolved === "light"
                        ? "rgba(241,245,249,0.95)"
                        : "rgba(255,255,255,0.08)"
                      : theme.resolved === "light"
                        ? "rgba(255,255,255,0.55)"
                        : "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(16px)",
                    "&:hover": {
                      backgroundColor:
                        theme.resolved === "light"
                          ? "rgba(241,245,249,0.95)"
                          : "rgba(255,255,255,0.08)",
                    },
                    "& .MuiTab-wrapper": {
                      alignItems: "center",
                    },
                  }}
                />
              )
            })}
          </Tabs>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition",
              theme.card,
              theme.hover
            )}
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
                className={cn(
                  "absolute right-0 top-12 z-40 w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40",
                  theme.panel
                )}
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
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                          theme.hover
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
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
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                        theme.hover
                      )}
                    >
                      <span className="text-sm">{item.label}</span>
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
