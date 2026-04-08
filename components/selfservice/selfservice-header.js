"use client"

import { useState } from "react"
import {
  BookOpen,
  ClipboardList,
  LogOut,
  Menu,
  Search,
  Ticket,
  UserCircle2,
  X,
  Grid3X3,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/components/shared-ui"

const mobileNavItems = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "catalog", label: "Catalog", icon: Grid3X3 },
  { id: "tickets", label: "My Tickets", icon: Ticket },
  { id: "requests", label: "My Requests", icon: ClipboardList },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
]

export default function SelfServiceHeader({
  theme,
  tenantName,
  onNavigate,
  onLogout,
  user,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const goTo = (pageId, label) => {
    setMenuOpen(false)
    onNavigate?.(pageId, label)
  }

  return (
    <>
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
              onClick={() => onNavigate?.("catalog", "Catalog")}
              className={cn("rounded-2xl px-3 py-2 text-sm transition", theme.hover)}
            >
              <span className="inline-flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Catalog
              </span>
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
              onClick={() => setMenuOpen(true)}
              className={cn("rounded-2xl p-2 transition lg:hidden", theme.hover)}
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div
              className={cn(
                "hidden items-center gap-2 rounded-2xl border px-3 py-2 md:flex",
                theme.card
              )}
            >
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

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className={cn(
              "absolute right-4 top-4 w-[calc(100vw-32px)] max-w-sm rounded-[28px] border p-4 shadow-2xl",
              theme.panel
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{tenantName || "Portal"}</div>
                <div className={cn("text-xs", theme.muted)}>Self Service menu</div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className={cn("rounded-2xl p-2 transition", theme.hover)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                    theme.muted
                  )}
                />
                <input
                  placeholder="Search..."
                  className={cn(
                    "h-10 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none",
                    theme.input
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              {mobileNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => goTo(item.id, item.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition",
                      theme.hover
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className={cn("my-4 border-t", theme.line)} />

            <div className="space-y-2">
              <button
                onClick={() => goTo("raise-incident", "Submit Incident")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition",
                  theme.hover
                )}
              >
                <Ticket className="h-4 w-4" />
                <span>Submit Incident</span>
              </button>

              <button
                onClick={() => goTo("new-request", "Submit Request")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition",
                  theme.hover
                )}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Submit Request</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onLogout?.()
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
