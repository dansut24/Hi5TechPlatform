"use client"

import { useEffect, useState } from "react"
import {
  Download,
  FolderOpen,
  Monitor,
  RefreshCw,
  TerminalSquare,
  Upload,
  Wrench,
} from "lucide-react"
import { cn } from "@/components/shared-ui"
import { hasControlCapability } from "@/lib/permissions/control"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import ControlCapabilityGate from "@/components/control/capability-gate"

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

function ActionTile({ theme, icon: Icon, title, description }) {
  return (
    <button className="text-left">
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

export default function ControlDeviceDetail({
  theme,
  tenantSlug,
  id,
  permissionContext = {},
}) {
  const canViewDevices = hasControlCapability(permissionContext, "control.devices.view")

  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug || !id || !canViewDevices) return
        setLoading(true)
        setError("")

        const res = await fetch(`/api/tenant/${tenantSlug}/devices`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load device")

        const match = (json.devices || []).find((d) => String(d.id) === String(id))
        if (!match) throw new Error("Device not found")

        if (alive) setDevice(match)
      } catch (err) {
        if (alive) setError(err.message || "Failed to load device")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug, id, canViewDevices])

  if (!canViewDevices) {
    return (
      <ShellCard theme={theme} className="p-5">
        <div className="text-lg font-semibold">Access denied</div>
        <div className={cn("mt-2 text-sm", theme.muted)}>
          You do not have permission to view device details.
        </div>
      </ShellCard>
    )
  }

  if (loading) return <div className="text-sm">Loading device...</div>
  if (error) return <div className="text-sm text-rose-400">{error}</div>
  if (!device) return null

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title={device.hostname}
        subtitle="Device details and operational actions."
        action={
          <ActionButton theme={theme}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ActionButton>
        }
      />

      <ShellCard theme={theme} className="p-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <div className={cn("mb-1", theme.muted)}>Hostname</div>
            <div>{device.hostname}</div>
          </div>
          <div>
            <div className={cn("mb-1", theme.muted)}>OS</div>
            <div>{device.os_name || "Unknown OS"}</div>
          </div>
          <div>
            <div className={cn("mb-1", theme.muted)}>Status</div>
            <DeviceStatusChip status={device.status} />
          </div>
          <div>
            <div className={cn("mb-1", theme.muted)}>Last seen</div>
            <div>
              {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.remote.use"
        >
          <ActionTile
            theme={theme}
            icon={Monitor}
            title="Remote session"
            description="Launch remote desktop or view session support."
          />
        </ControlCapabilityGate>

        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.shell.use"
        >
          <ActionTile
            theme={theme}
            icon={TerminalSquare}
            title="Shell"
            description="Open terminal or command session tools."
          />
        </ControlCapabilityGate>

        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.files.use"
        >
          <ActionTile
            theme={theme}
            icon={FolderOpen}
            title="File browser"
            description="Browse device files and folders."
          />
        </ControlCapabilityGate>

        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.files.use"
        >
          <ActionTile
            theme={theme}
            icon={Upload}
            title="Upload file"
            description="Send files to the endpoint."
          />
        </ControlCapabilityGate>

        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.files.use"
        >
          <ActionTile
            theme={theme}
            icon={Download}
            title="Download file"
            description="Retrieve files from the endpoint."
          />
        </ControlCapabilityGate>

        <ControlCapabilityGate
          permissionContext={permissionContext}
          capability="control.patching.view"
        >
          <ActionTile
            theme={theme}
            icon={Wrench}
            title="Patching"
            description="Review missing updates and remediation."
          />
        </ControlCapabilityGate>
      </div>
    </div>
  )
}
