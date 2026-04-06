"use client"

import { cn } from "@/components/shared-ui"

export default function ActionButton({ children, theme, secondary = false, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm transition disabled:opacity-60",
        secondary
          ? cn(theme.card, theme.hover, "border")
          : theme.resolved === "light"
            ? "bg-slate-950 text-white hover:bg-slate-800"
            : "bg-white text-slate-950 hover:bg-slate-200"
      )}
    >
      {children}
    </button>
  )
}
