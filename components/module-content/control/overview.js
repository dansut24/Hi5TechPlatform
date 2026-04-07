"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Monitor,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  Wrench,
} from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function QuickActionCard({ title, description, icon: Icon, theme, onClick }) {
  return (
    <button onClick={onClick} className="text-left">
      <ShellCard theme={theme} className="h-full p-5 transition hover:scale-[1.01]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{title}</div>
            <div className={cn("mt-1 text-sm", theme.muted)}>{description}</div>
          </div>
          <div className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </ShellCard>
    </button>
  )
}

export default function ControlOverview({ theme, tenantSlug, onNavigate }) {
  const [devices, setDevices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [devicesError, setDevicesError] = useState("")
  const [alertsError, setAlertsError] = useState("")

  const onlineCount = useMemo(
    () => devices.filter((d) => (d.status || "").toLowerCase() === "online").length,
    [devices]
  )

  const offlineCount = useMemo(
    () => devices.filter((d) => (d.status || "").toLowerCase() === "offline").length,
    [devices]
  )

  const warningCount = useMemo(
    () => devices.filter((d) => (d.status || "").toLowerCase() === "warning").length,
    [devices]
  )

  useEffect(() => {
    let alive = true

    async function loadDevices() {
      try {
        if (!tenantSlug) return
        setLoadingDevices(true)
        setDevicesError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/devices`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load devices")
        if (alive) setDevices(json.devices || [])
      } catch (err) {
        if (alive) setDevicesError(err.message || "Failed to load devices")
      } finally {
        if (alive) setLoadingDevices(false)
      }
    }

    async function loadAlerts() {
      try {
        if (!tenantSlug) return
        setLoadingAlerts(true)
        setAlertsError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/alerts`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load alerts")
        if (alive) setAlerts(json.alerts || [])
      } catch (err) {
        if (alive) setAlertsError(err.message || "Failed to load alerts")
      } finally {
        if (alive) setLoadingAlerts(false)
      }
    }

    loadDevices()
    loadAlerts()

    return () => {
      alive = false
    }
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Control overview"
        subtitle="Devices, monitoring, remote tools, patching, and operational health."
        action={
          <ActionButton theme={theme}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ActionButton>
        }
      />

      {(devicesError || alertsError) ? (
        <div className="space-y-1">
          {devicesError ? <div className="text-sm text-rose-400">{devicesError}</div> : null}
          {alertsError ? <div className="text-sm text-rose-400">{alertsError}</div> : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total devices", loadingDevices ? "…" : devices.length],
          ["Online", loadingDevices ? "…" : onlineCount],
          ["Offline", loadingDevices ? "…" : offlineCount],
          ["Warnings", loadingDevices ? "…" : warningCount],
        ].map(([label, value]) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className={cn("text-sm", theme.muted)}>{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
          </ShellCard>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          theme={theme}
          title="Devices"
          description="Browse and manage managed endpoints."
          icon={Monitor}
          onClick={() => onNavigate?.("devices", "Devices")}
        />
        <QuickActionCard
          theme={theme}
          title="Alerts"
          description="Review active operational issues."
          icon={AlertTriangle}
          onClick={() => onNavigate?.("alerts", "Alerts")}
        />
        <QuickActionCard
          theme={theme}
          title="Patching"
          description="Track compliance and missing updates."
          icon={Wrench}
          onClick={() => onNavigate?.("patching", "Patching")}
        />
        <QuickActionCard
          theme={theme}
          title="Remote tools"
          description="Launch support tools and sessions."
          icon={TerminalSquare}
          onClick={() => onNavigate?.("remote", "Remote Tools")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Recent devices</div>
            <button
              onClick={() => onNavigate?.("devices", "Devices")}
              className={cn("text-sm", theme.muted)}
            >
              View all
            </button>
          </div>

          {loadingDevices ? (
            <div className="text-sm">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="text-sm">No devices found.</div>
          ) : (
            <div className="space-y-3">
              {devices.slice(0, 6).map((device) => (
                <button
                  key={device.id}
                  onClick={() => onNavigate?.(`device-${device.id}`, device.hostname)}
                  className="block w-full text-left"
                >
                  <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{device.hostname}</div>
                        <div className={cn("mt-1 text-sm", theme.muted)}>
                          {device.os_name || "Unknown OS"}
                        </div>
                      </div>
                      <div className="text-xs capitalize">{device.status || "unknown"}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ShellCard>

        <div className="space-y-6">
          <ShellCard theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <div className="text-lg font-semibold">Patch snapshot</div>
            </div>

            <div className="space-y-3">
              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={cn("text-sm", theme.muted)}>Devices likely compliant</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loadingDevices ? "…" : Math.max(devices.length - warningCount, 0)}
                </div>
              </div>

              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={cn("text-sm", theme.muted)}>Devices needing review</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loadingDevices ? "…" : warningCount}
                </div>
              </div>
            </div>
          </ShellCard>

          <ShellCard theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <div className="text-lg font-semibold">Recent alerts</div>
            </div>

            {loadingAlerts ? (
              <div className="text-sm">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-sm">No alerts found.</div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                  >
                    <div className="text-sm font-medium">
                      {alert.title || alert.type || "Alert"}
                    </div>
                    <div className={cn("mt-1 text-sm", theme.muted)}>
                      {alert.message || alert.description || "No description"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>
        </div>
      </div>
    </div>
  )
}
