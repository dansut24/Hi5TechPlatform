"use client"

import { motion } from "framer-motion"
import { ChevronRight, Search, X } from "lucide-react"
import { cn } from "@/components/shared-ui"

function Pill({ children, theme }) {
  return <div className={cn("rounded-full border px-3 py-1 text-xs", theme.card, theme.muted)}>{children}</div>
}

export default function GlobalSearchModal({ open, onClose, query, setQuery, currentModuleTitle, theme }) {
  const quickItems = [
    { section: "Navigate", label: `${currentModuleTitle} dashboard`, hint: "Open current module home" },
    { section: "Navigate", label: "Back to module selector", hint: "Switch product area" },
    { section: "Records", label: "Search incidents", hint: "INC-10492, VPN, email delay" },
    { section: "Records", label: "Search devices", hint: "Laptop, server, firewall" },
    { section: "Knowledge", label: "Search knowledge articles", hint: "BitLocker, onboarding, VPN" },
    { section: "Actions", label: "Create new ticket", hint: "Incident or request" },
  ]

  const filtered = quickItems.filter((item) => `${item.section} ${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={cn("mx-auto mt-20 w-[min(92vw,760px)] rounded-[32px] border shadow-2xl shadow-black/50", theme.panel)}
      >
        <div className={cn("border-b p-4 sm:p-5", theme.line)}>
          <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", theme.card)}>
            <Search className={cn("h-5 w-5", theme.muted)} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules, records, devices, knowledge, actions..."
              className={cn("w-full bg-transparent text-sm outline-none", theme.resolved === "light" ? "placeholder:text-slate-400" : "placeholder:text-slate-500")}
            />
            <button onClick={onClose} className={cn("rounded-xl p-2 transition", theme.hover)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Pill theme={theme}>Global Search</Pill>
            <Pill theme={theme}>{currentModuleTitle}</Pill>
            <Pill theme={theme}>Press Esc to close</Pill>
          </div>
          <div className="space-y-2">
            {filtered.map((item) => (
              <button key={`${item.section}-${item.label}`} className={cn("flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition", theme.card, theme.hover)}>
                <div>
                  <div className={cn("text-xs uppercase tracking-wide", theme.muted2)}>{item.section}</div>
                  <div className="mt-1 text-sm font-medium">{item.label}</div>
                  <div className={cn("mt-1 text-xs", theme.muted)}>{item.hint}</div>
                </div>
                <ChevronRight className={cn("h-4 w-4", theme.muted2)} />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
