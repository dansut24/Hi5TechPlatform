"use client"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import StatusChip from "@/components/module-content/shared/status-chip"

export default function SelfServiceIncidentsList({ theme, tenantSlug, onNavigate }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug) return

        setLoading(true)
        setError("")

        const url = `/api/tenant/${tenantSlug}/selfservice/incidents?q=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}`
        const res = await fetch(url, { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load incidents")
        }

        if (alive) setRows(json.incidents || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load incidents")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [tenantSlug, query, statusFilter])

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="My Incidents"
        subtitle="Track the incidents you have raised."
        action={
          <ActionButton
            theme={theme}
            onClick={() => onNavigate?.("raise-incident", "Raise Incident")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Raise Incident
          </ActionButton>
        }
      />

      <ShellCard theme={theme} className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr,200px]">
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
              placeholder="Search my incidents..."
              className={cn(
                "h-11 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none",
                theme.input
              )}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </ShellCard>

      <ShellCard theme={theme} className="overflow-hidden">
        <div
          className={cn(
            "grid grid-cols-[140px,1fr,120px,140px,160px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide",
            theme.line,
            theme.muted2
          )}
        >
          <div>Number</div>
          <div>Short description</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading incidents...</div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-rose-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-6 text-sm">No incidents found.</div>
        ) : (
          rows.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(`incident-${item.id}`, item.number)}
              className={cn(
                "grid w-full grid-cols-[140px,1fr,120px,140px,160px] gap-4 border-b px-5 py-4 text-left text-sm last:border-b-0 hover:bg-white/5",
                theme.line
              )}
            >
              <div className="font-medium">{item.number}</div>
              <div>{item.short_description}</div>
              <div className="capitalize">{item.priority}</div>
              <div>
                <StatusChip status={item.status} />
              </div>
              <div>{new Date(item.created_at).toLocaleDateString()}</div>
            </button>
          ))
        )}
      </ShellCard>
    </div>
  )
}
