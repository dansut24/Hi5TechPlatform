"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import StatusChip from "@/components/module-content/shared/status-chip"

export default function ControlAlerts({ theme, tenantSlug }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug) return
        setLoading(true)
        setError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/alerts`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load alerts")
        if (alive) setAlerts(json.alerts || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load alerts")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Alerts"
        subtitle="Current tenant operational issues and monitoring events."
        action={
          <ActionButton theme={theme}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ActionButton>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <ShellCard theme={theme} className="overflow-hidden">
        <div
          className={cn(
            "grid grid-cols-[1.1fr,1.6fr,140px,160px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide",
            theme.line,
            theme.muted2
          )}
        >
          <div>Type</div>
          <div>Description</div>
          <div>Status</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="px-5 py-6 text-sm">No alerts found.</div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "grid grid-cols-[1.1fr,1.6fr,140px,160px] gap-4 border-b px-5 py-4 text-sm last:border-b-0",
                theme.line
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                {alert.title || alert.type || "Alert"}
              </div>
              <div>{alert.message || alert.description || "No description"}</div>
              <div>
                <StatusChip status={alert.status || "open"} />
              </div>
              <div>
                {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "—"}
              </div>
            </div>
          ))
        )}
      </ShellCard>
    </div>
  )
}
