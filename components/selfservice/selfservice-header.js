"use client"

import { BookOpen, ClipboardList, LogOut, Menu, Search, Ticket, UserCircle2 } from "lucide-react"
import { cn } from "@/components/shared-ui"

export default function SelfServiceHeader({
  theme,
  tenantName,
  onNavigate,
  onLogout,
  user,
}) {
  return (
    <div
      className={cn("sticky top-0 z-50 border-b backdrop-blur-xl", theme.header)}
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        <div className="min-w-0 shrink-0">
          <div className="text-sm font-semibold">{tenantName || "Portal"}</div>
          <div className={cn("text-xs", theme.muted)}>Self Service</div>
        </div>

        <div className="mx-auto hidden max-w-2xl flex-1 md:block">
          <div className="relative">
            <Search
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                theme.muted
              )}
            />
            <input
              placeholder="Search knowledge, tickets, and requests..."
              className={cn(
                "h-10 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none",
                theme.input
              )}
            />
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={() => onNavigate?.("home", "Home")}
            className={cn("rounded-2xl px-3 py-2 text-sm transition", theme.hover)}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate?.("raise-incident", "Submit Incident")}
            className={cn("rounded-2xl px-3 py-2 text-sm transition", theme.hover)}
          >
            <span className="inline-flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Incident
            </span>
          </button>
          <button
            onClick={() => onNavigate?.("new-request", "Submit Request")}
            className={cn("rounded-2xl px-3 py-2 text-sm transition", theme.hover)}
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Request
            </span>
          </button>
          <button
            onClick={() => onNavigate?.("knowledge", "Knowledge")}
            className={cn("rounded-2xl px-3 py-2 text-sm transition", theme.hover)}
          >
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.("home", "Home")}
            className={cn("rounded-2xl p-2 transition lg:hidden", theme.hover)}
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className={cn("hidden items-center gap-2 rounded-2xl border px-3 py-2 md:flex", theme.card)}>
            <UserCircle2 className="h-4 w-4" />
            <span className="max-w-[140px] truncate text-sm">
              {user?.name || "User"}
            </span>
          </div>

          <button
            onClick={onLogout}
            className={cn("rounded-2xl p-2 transition", theme.hover)}
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
