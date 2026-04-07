"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, ShieldCheck, Wrench } from "lucide-react"
import { cn } from "@/components/shared-ui"
import { hasControlCapability } from "@/lib/permissions/control"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

export default function ControlPatching({ theme, tenantSlug, permissionContext = {} }) {
  const canViewPatching = hasControlCapability(permissionContext, "control.patching.view")
  const canManagePatching = hasControlCapability(permissionContext, "control.patching.manage")

  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug || !canViewPatching) return
        setLoading(true)
        setError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/devices`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load devices")
        if (alive) setDevices(json.devices || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load patching data")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug, canViewPatching])

  const warningCount = useMemo(
    () => devices.filter((d) => (d.status || "").toLowerCase() === "warning").length,
    [devices]
  )

  const compliantCount = useMemo(
    () => Math.max(devices.length - warningCount, 0),
    [devices, warningCount]
  )

  if (!canViewPatching) {
    return (
      <ShellCard theme={theme} className="p-5">
        <div className="text-lg font-semibold">Access denied</div>
        <div className={cn("mt-2 text-sm", theme.muted)}>
          You do not have permission to view patching information.
        </div>
      </ShellCard>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Patching"
        subtitle="Compliance and remediation snapshot for managed devices."
        action={
          <div className="flex gap-2">
            <ActionButton theme={theme}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </ActionButton>
            {canManagePatching ? (
              <ActionButton theme={theme} secondary>
                Manage Policies
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <ShellCard theme={theme} className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <div className="text-lg font-semibold">Compliant</div>
          </div>
          <div className="mt-3 text-3xl font-semibold">{loading ? "…" : compliantCount}</div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <div className="text-lg font-semibold">Needs review</div>
          </div>
          <div className="mt-3 text-3xl font-semibold">{loading ? "…" : warningCount}</div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Suggested action</div>
          <div className={cn("mt-3 text-sm", theme.muted)}>
            Review warning-state devices and schedule remediation windows.
          </div>
        </ShellCard>
      </div>
    </div>
  )
}
