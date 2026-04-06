"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Download,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  TerminalSquare,
  Upload,
  Wrench,
} from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import StatusChip from "@/components/module-content/shared/status-chip"

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

function EmptyStateCard({ theme, title, description }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="text-base font-semibold">{title}</div>
      <div className={cn("mt-2 text-sm", theme.muted)}>{description}</div>
    </ShellCard>
  )
}

export default function ControlWorkspace({ theme, tenantSlug, onNavigate }) {
  const [devices, setDevices] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [devicesError, setDevicesError] = useState("")
  const [query, setQuery] = useState("")

  const [alerts, setAlerts] = useState([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
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

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return devices

    return devices.filter((device) =>
      [
        device.hostname,
        device.os_name,
        device.status,
        device.last_seen_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [devices, query])

  useEffect(() => {
    let alive = true

    async function loadDevices() {
      try {
        if (!tenantSlug) return
        setLoadingDevices(true)
        setDevicesError("")

        const res = await fetch(`/api/tenant/${tenantSlug}/devices`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load devices")
        }

        if (alive) {
          setDevices(json.devices || [])
        }
      } catch (err) {
        if (alive) setDevicesError(err.message || "Failed to load devices")
      } finally {
        if (alive) setLoadingDevices(false)
      }
    }

    loadDevices()

    return () => {
      alive = false
    }
  }, [tenantSlug])

  useEffect(() => {
    let alive = true

    async function loadAlerts() {
      try {
        if (!tenantSlug) return
        setLoadingAlerts(true)
        setAlertsError("")

        const res = await fetch(`/api/tenant/${tenantSlug}/alerts`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load alerts")
        }

        if (alive) {
          setAlerts(json.alerts || [])
        }
      } catch (err) {
        if (alive) setAlertsError(err.message || "Failed to load alerts")
      } finally {
        if (alive) setLoadingAlerts(false)
      }
    }

    loadAlerts()

    return () => {
      alive = false
    }
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Control workspace"
        subtitle="Devices, monitoring, remote tools, jobs, and patching."
        action={
          <div className="flex gap-2">
            <ActionButton theme={theme}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </ActionButton>
            <ActionButton theme={theme} secondary>
              <Monitor className="mr-2 h-4 w-4" />
              Add Device
            </ActionButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Total devices</div>
          <div className="mt-2 text-3xl font-semibold">
            {loadingDevices ? "…" : devices.length}
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Online</div>
          <div className="mt-2 text-3xl font-semibold">
            {loadingDevices ? "…" : onlineCount}
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Offline</div>
          <div className="mt-2 text-3xl font-semibold">
            {loadingDevices ? "…" : offlineCount}
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Warnings</div>
          <div className="mt-2 text-3xl font-semibold">
            {loadingDevices ? "…" : warningCount}
          </div>
        </ShellCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          theme={theme}
          title="Remote tools"
          description="Launch remote support, shell, or file actions."
          icon={TerminalSquare}
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
          description="See compliance and missing updates."
          icon={Wrench}
          onClick={() => onNavigate?.("patching", "Patching")}
        />
        <QuickActionCard
          theme={theme}
          title="Reports"
          description="Check device and control reporting."
          icon={Activity}
          onClick={() => onNavigate?.("reports", "Reports")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <ShellCard theme={theme} className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Devices</div>
                <div className={cn("text-sm", theme.muted)}>
                  Current tenant device estate and connection state.
                </div>
              </div>
              <ActionButton
                theme={theme}
                secondary
                onClick={() => onNavigate?.("devices", "Devices")}
              >
                View all
              </ActionButton>
            </div>

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
          </div>

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

          {loadingDevices ? (
            <div className="px-5 py-6 text-sm">Loading devices...</div>
          ) : devicesError ? (
            <div className="px-5 py-6 text-sm text-rose-400">{devicesError}</div>
          ) : filteredDevices.length === 0 ? (
            <div className="px-5 py-6 text-sm">No devices found.</div>
          ) : (
            filteredDevices.slice(0, 8).map((device) => (
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

        <div className="space-y-6">
          <ShellCard theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <div className="text-lg font-semibold">Patch compliance</div>
            </div>

            <div className="space-y-3">
              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={cn("text-sm", theme.muted)}>Compliant devices</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loadingDevices ? "…" : Math.max(devices.length - warningCount, 0)}
                </div>
              </div>

              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={cn("text-sm", theme.muted)}>Devices needing attention</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loadingDevices ? "…" : warningCount}
                </div>
              </div>

              <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={cn("text-sm", theme.muted)}>Suggested action</div>
                <div className="mt-2 text-sm">
                  Review missing updates and schedule remediation windows.
                </div>
              </div>
            </div>
          </ShellCard>

          <ShellCard theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <div className="text-lg font-semibold">Recent alerts</div>
            </div>

            {loadingAlerts ? (
              <div className="text-sm">Loading alerts...</div>
            ) : alertsError ? (
              <div className="text-sm text-rose-400">{alertsError}</div>
            ) : alerts.length === 0 ? (
              <div className="text-sm">No alerts found.</div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">
                          {alert.title || alert.type || "Alert"}
                        </div>
                        <div className={cn("mt-1 text-sm", theme.muted)}>
                          {alert.message || alert.description || "No description"}
                        </div>
                      </div>
                      <StatusChip status={alert.status || "open"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            <QuickActionCard
              theme={theme}
              title="Upload file"
              description="Send a file to a managed device."
              icon={Upload}
            />
            <QuickActionCard
              theme={theme}
              title="Download file"
              description="Retrieve files from a managed device."
              icon={Download}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <EmptyStateCard
          theme={theme}
          title="Remote support"
          description="This space is ready for session launch, shell, file browser, and live desktop actions."
        />
        <EmptyStateCard
          theme={theme}
          title="Jobs"
          description="Add scheduled tasks, script runs, and reboot actions here next."
        />
        <EmptyStateCard
          theme={theme}
          title="Reporting"
          description="Add compliance, inventory, and control reports for device operations."
        />
      </div>
    </div>
  )
}
