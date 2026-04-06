"use client"

import { History } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"

export default function ActivityPanel({ theme, title = "Activity", activity = [], loading = false, error = "" }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        <div className="text-lg font-semibold">{title}</div>
      </div>

      {loading ? (
        <div className="text-sm">Loading activity...</div>
      ) : error ? (
        <div className="text-sm text-rose-400">{error}</div>
      ) : activity.length === 0 ? (
        <div className="text-sm">No activity yet.</div>
      ) : (
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{item.message || item.event_type}</div>
                  <div className={cn("mt-1 text-xs", theme.muted)}>
                    {item.profiles?.full_name || item.profiles?.email || "System"}
                  </div>
                </div>
                <div className={cn("shrink-0 text-xs", theme.muted2)}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ShellCard>
  )
}
