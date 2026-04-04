"use client"

import { cn } from "@/components/shared-ui"

export function NotificationBell({ theme, mobile = false }) {
  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-[16px] transition",
        mobile ? "h-9 w-9 lg:h-10 lg:w-10" : "h-10 w-10",
        theme.hover
      )}
      aria-label="Notifications"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
    </button>
  )
}

export default function HeaderBar({ theme, currentModuleTitle, branding, tenantName }) {
  return (
    <header className={cn("sticky top-0 z-30 border-b backdrop-blur-xl", theme.header, theme.line)}>
      <div
        className="px-5 py-4 lg:px-8"
        style={{
          background: branding?.brandHex
            ? "linear-gradient(180deg, rgba(var(--tenant-brand-rgb),0.10), rgba(var(--tenant-brand-rgb),0.02))"
            : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={cn("text-xs uppercase tracking-[0.16em]", theme.muted2)}>
              {tenantName || "Workspace"}
            </div>
            <div className="truncate text-2xl font-semibold tracking-tight">
              {currentModuleTitle}
            </div>
          </div>

          <div
            className={cn("hidden rounded-full border px-3 py-1.5 text-xs md:inline-flex", theme.card, theme.muted)}
            style={{
              borderColor: branding?.brandHex ? "rgba(var(--tenant-brand-rgb),0.18)" : undefined,
            }}
          >
            Tenant branded workspace
          </div>
        </div>
      </div>
    </header>
  )
}
