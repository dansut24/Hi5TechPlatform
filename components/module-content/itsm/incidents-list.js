"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function StatusChip({ status, statuses = [] }) {
  const statusRow = statuses.find((item) => item.key === status)
  const category = statusRow?.category || "open"

  let styles = "bg-slate-500/10 text-slate-400"
  if (category === "open") styles = "bg-blue-500/10 text-blue-400"
  if (category === "pending") styles = "bg-violet-500/10 text-violet-400"
  if (category === "resolved") styles = "bg-emerald-500/10 text-emerald-400"
  if (category === "closed") styles = "bg-slate-500/10 text-slate-300"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {statusRow?.label || status || "Unknown"}
    </span>
  )
}

function PriorityChip({ priority }) {
  const p = (priority || "").toLowerCase()

  let styles = "bg-slate-500/10 text-slate-400"
  if (p === "low") styles = "bg-emerald-500/10 text-emerald-400"
  if (p === "medium") styles = "bg-blue-500/10 text-blue-400"
  if (p === "high") styles = "bg-amber-500/10 text-amber-400"
  if (p === "critical") styles = "bg-rose-500/10 text-rose-400"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {priority || "unknown"}
    </span>
  )
}

export default function ITSMIncidentsList({ theme, tenantSlug, onNavigate }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [rows, setRows] = useState([])
  const [workflow, setWorkflow] = useState({
    statuses: [],
    users: [],
    groups: [],
  })
  const [loading, setLoading] = useState(true)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function loadRows() {
      try {
        if (!tenantSlug) return
        setLoading(true)
        setError("")

        const url = query
          ? `/api/tenant/${tenantSlug}/incidents?q=${encodeURIComponent(query)}`
          : `/api/tenant/${tenantSlug}/incidents`

        const res = await fetch(url, { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || "Failed to load incidents")
        if (alive) setRows(json.incidents || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load incidents")
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadRows()
    return () => {
      alive = false
    }
  }, [tenantSlug, query])

  useEffect(() => {
    let alive = true

    async function loadWorkflow() {
      try {
        if (!tenantSlug) return
        setWorkflowLoading(true)

        const res = await fetch(`/api/tenant/${tenantSlug}/itsm/incident-workflow`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load workflow")

        if (alive) {
          setWorkflow({
            statuses: json.statuses || [],
            users: json.users || [],
            groups: json.groups || [],
          })
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load workflow")
      } finally {
        if (alive) setWorkflowLoading(false)
      }
    }

    loadWorkflow()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows
    return rows.filter((row) => row.status === statusFilter)
  }, [rows, statusFilter])

  const getAssignedUser = (assignedTo) => {
    const userRow = workflow.users.find((row) => row.user_id === assignedTo)
    return userRow?.profile?.full_name || userRow?.profile?.email || "Unassigned"
  }

  const getAssignedGroup = (groupId) => {
    const groupRow = workflow.groups.find((row) => row.id === groupId)
    return groupRow?.name || "No group"
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Incident management"
        subtitle="Track, assign, prioritise, and resolve operational disruption."
        action={
          <ActionButton theme={theme} onClick={() => onNavigate?.("new-incident", "New Incident")}>
            New Incident
          </ActionButton>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <ShellCard theme={theme} className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr,240px]">
          <div className="relative">
            <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", theme.muted)} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents..."
              className={cn("h-11 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none", theme.input)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={workflowLoading}
            className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
          >
            <option value="">All statuses</option>
            {workflow.statuses.map((status) => (
              <option key={status.id} value={status.key}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </ShellCard>

      <ShellCard theme={theme} className="overflow-hidden">
        <div className={cn("grid grid-cols-[140px,1.4fr,140px,140px,180px,180px,140px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
          <div>Number</div>
          <div>Short description</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Assigned to</div>
          <div>Group</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading incidents...</div>
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-6 text-sm">No incidents found.</div>
        ) : (
          filteredRows.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate?.(`itsm-incident-${item.id}`, item.number)}
              className={cn("grid cursor-pointer grid-cols-[140px,1.4fr,140px,140px,180px,180px,140px] gap-4 border-b px-5 py-4 text-sm last:border-b-0 hover:bg-white/5", theme.line)}
            >
              <div className="font-medium">{item.number}</div>
              <div>{item.short_description}</div>
              <div><PriorityChip priority={item.priority} /></div>
              <div><StatusChip status={item.status} statuses={workflow.statuses} /></div>
              <div>{getAssignedUser(item.assigned_to)}</div>
              <div>{getAssignedGroup(item.assignment_group_id)}</div>
              <div>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</div>
            </div>
          ))
        )}
      </ShellCard>
    </div>
  )
}
