"use client"

import { cn } from "@/components/shared-ui"

export default function ShellCard({ children, theme, className = "" }) {
  return (
    <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>
      {children}
    </div>
  )
}
