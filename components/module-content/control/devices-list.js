"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Search } from "lucide-react"
import { cn } from "@/components/shared-ui"
import { hasControlCapability } from "@/lib/permissions/control"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function DeviceStatusChip({ status }) {
  const s = (status || "").toLowerCase()

  let styles = "bg-slate-500/10 text-slate-400"
  if (s === "online") styles = "bg-emerald-500/10 text-emerald-400"
  if (s === "offline") styles = "bg-rose-500/10 text-rose-400"
  if (s === "warning") styles = "bg-amber-500/10 text-amber-400"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status || "unknown"}
    </span>
  )
}

export default function ControlDevicesList({
  theme,
  tenantSlug,
  onNavigate,
  permissionContext = {},
}) {
  const canViewDevices = hasControlCapability(permissionContext, "control.devices.view")

  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug || !canViewDevices) return
        setLoading(true)
        setError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/devices`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load devices")
        if (alive) setDevices(json.devices || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load devices")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug, canViewDevices])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return devices
    return devices.filter((d) =>
      [d.hostname, d.os_name, d.status, d.last_seen_at]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [devices, query])

  if (!canViewDevices) {
    return (
      <ShellCard theme={theme} className="p-5">
        <div className="text-lg font-semibold">Access denied</div>
        <div className={cn("mt-2 text-sm", theme.muted)}>
          You do not have permission to view managed devices.
        </div>
      </ShellCard>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Devices"
        subtitle="Managed endpoints and their current connection state."
        action={
          <ActionButton theme={theme}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ActionButton>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <ShellCard theme={theme} className="p-4">
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              theme.muted
            )}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devices..."
            className={cn(
              "h-11 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none",
              theme.input
            )}
          />
        </div>
      </ShellCard>

      <ShellCard theme={theme} className="overflow-hidden">
        <div
          className={cn(
            "grid grid-cols-[1.2fr,1fr,120px,160px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide",
            theme.line,
            theme.muted2
          )}
        >
          <div>Hostname</div>
          <div>OS</div>
          <div>Status</div>
          <div>Last Seen</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading devices...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-6 text-sm">No devices found.</div>
        ) : (
          filtered.map((device) => (
            <button
              key={device.id}
              onClick={() => onNavigate?.(`device-${device.id}`, device.hostname)}
              className={cn(
                "grid w-full grid-cols-[1.2fr,1fr,120px,160px] gap-4 border-b px-5 py-4 text-left text-sm last:border-b-0 hover:bg-white/5",
                theme.line
              )}
            >
              <div className="font-medium">{device.hostname}</div>
              <div>{device.os_name || "Unknown OS"}</div>
              <div>
                <DeviceStatusChip status={device.status} />
              </div>
              <div>
                {device.last_seen_at
                  ? new Date(device.last_seen_at).toLocaleDateString()
                  : "—"}
              </div>
            </button>
          ))
        )}
      </ShellCard>
    </div>
  )
}
