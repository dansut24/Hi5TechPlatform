"use client"

import { cn } from "@/components/shared-ui"

export default function SectionTitle({ title, subtitle, action, theme }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className={cn("mt-1 text-sm", theme.muted)}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
