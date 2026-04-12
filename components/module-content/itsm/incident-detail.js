"use client"

import { useEffect, useMemo, useState } from "react"
import { History, MessageSquare, NotebookPen } from "lucide-react"
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

function CommentsPanel({
  theme,
  title,
  icon: Icon,
  comments = [],
  loading = false,
  error = "",
  newComment,
  setNewComment,
  onSubmit,
  saving = false,
  placeholder = "Add note...",
  accent = "default",
}) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <div className="text-lg font-semibold">{title}</div>
      </div>

      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : error ? (
        <div className="text-sm text-rose-400">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-sm">No entries yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "rounded-2xl border p-4",
                accent === "internal" ? "bg-amber-500/5" : theme.subCard,
                theme.line
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {comment.profiles?.full_name || comment.profiles?.email || "Unknown user"}
                  </div>
                  <div className={cn("mt-1 whitespace-pre-wrap text-sm", theme.muted)}>
                    {comment.body}
                  </div>
                </div>
                <div className={cn("shrink-0 text-xs", theme.muted2)}>
                  {comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cn("mt-5 border-t pt-5", theme.line)}>
        <div className={cn("mb-2 text-sm", theme.muted)}>Add {title.toLowerCase()}</div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className={cn("min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
          placeholder={placeholder}
        />
        <div className="mt-3 flex justify-end">
          <ActionButton theme={theme} onClick={onSubmit} disabled={saving}>
            {saving ? "Posting..." : "Post"}
          </ActionButton>
        </div>
      </div>
    </ShellCard>
  )
}

function ActivityPanel({ theme, activity = [], loading = false, error = "" }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        <div className="text-lg font-semibold">Incident activity</div>
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

export default function ITSMIncidentDetail({ theme, tenantSlug, id }) {
  const [incident, setIncident] = useState(null)
  const [workflow, setWorkflow] = useState({
    statuses: [],
    users: [],
    groups: [],
  })

  const [loading, setLoading] = useState(true)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [error, setError] = useState("")

  const [publicComments, setPublicComments] = useState([])
  const [internalNotes, setInternalNotes] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState("")

  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState("")

  const [newPublicComment, setNewPublicComment] = useState("")
  const [newInternalNote, setNewInternalNote] = useState("")
  const [savingPublicComment, setSavingPublicComment] = useState(false)
  const [savingInternalNote, setSavingInternalNote] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)

  const statusOptions = workflow.statuses || []
  const userOptions = workflow.users || []
  const groupOptions = workflow.groups || []

  const assignedUserLabel = useMemo(() => {
    const userRow = userOptions.find((row) => row.user_id === incident?.assigned_to)
    return userRow?.profile?.full_name || userRow?.profile?.email || "Unassigned"
  }, [userOptions, incident?.assigned_to])

  const assignedGroupLabel = useMemo(() => {
    const groupRow = groupOptions.find((row) => row.id === incident?.assignment_group_id)
    return groupRow?.name || "No group"
  }, [groupOptions, incident?.assignment_group_id])

  async function loadIncident() {
    const res = await fetch(`/api/tenant/${tenantSlug}/incidents/${id}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load incident")
    setIncident(json.incident)
  }

  async function loadWorkflow() {
    const res = await fetch(`/api/tenant/${tenantSlug}/itsm/incident-workflow`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load workflow")
    setWorkflow({
      statuses: json.statuses || [],
      users: json.users || [],
      groups: json.groups || [],
    })
  }

  async function loadComments() {
    const res = await fetch(`/api/tenant/${tenantSlug}/incidents/${id}/comments`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load comments")

    const allComments = json.comments || []
    setPublicComments(allComments.filter((item) => item.visibility === "public"))
    setInternalNotes(allComments.filter((item) => item.visibility === "internal"))
  }

  async function loadActivity() {
    const res = await fetch(`/api/tenant/${tenantSlug}/activity/incident/${id}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load activity")
    setActivity(json.activity || [])
  }

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setLoading(true)
        setError("")
        await loadIncident()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load incident")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug && id) run()
    return () => {
      alive = false
    }
  }, [tenantSlug, id])

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setWorkflowLoading(true)
        await loadWorkflow()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load workflow")
      } finally {
        if (alive) setWorkflowLoading(false)
      }
    }

    if (tenantSlug) run()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setCommentsLoading(true)
        setCommentsError("")
        await loadComments()
      } catch (err) {
        if (alive) setCommentsError(err.message || "Failed to load comments")
      } finally {
        if (alive) setCommentsLoading(false)
      }
    }

    if (tenantSlug && id) run()
    return () => {
      alive = false
    }
  }, [tenantSlug, id])

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setActivityLoading(true)
        setActivityError("")
        await loadActivity()
      } catch (err) {
        if (alive) setActivityError(err.message || "Failed to load activity")
      } finally {
        if (alive) setActivityLoading(false)
      }
    }

    if (tenantSlug && id) run()
    return () => {
      alive = false
    }
  }, [tenantSlug, id])

  const saveField = async (patch) => {
    try {
      setSavingUpdate(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update incident")

      setIncident(json.incident)
      await loadActivity()
    } catch (err) {
      setError(err.message || "Failed to update incident")
    } finally {
      setSavingUpdate(false)
    }
  }

  const submitPublicComment = async () => {
    try {
      if (!newPublicComment.trim()) return
      setSavingPublicComment(true)
      setCommentsError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/incidents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newPublicComment,
          visibility: "public",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add public comment")

      setPublicComments((prev) => [...prev, json.comment])
      setNewPublicComment("")
      await loadActivity()
    } catch (err) {
      setCommentsError(err.message || "Failed to add public comment")
    } finally {
      setSavingPublicComment(false)
    }
  }

  const submitInternalNote = async () => {
    try {
      if (!newInternalNote.trim()) return
      setSavingInternalNote(true)
      setCommentsError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/incidents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newInternalNote,
          visibility: "internal",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add internal note")

      setInternalNotes((prev) => [...prev, json.comment])
      setNewInternalNote("")
      await loadActivity()
    } catch (err) {
      setCommentsError(err.message || "Failed to add internal note")
    } finally {
      setSavingInternalNote(false)
    }
  }

  if (loading || workflowLoading) return <div className="text-sm">Loading incident...</div>
  if (error && !incident) return <div className="text-sm text-rose-400">{error}</div>
  if (!incident) return null

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title={incident.number}
        subtitle="Incident details and workflow"
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <ShellCard theme={theme} className="p-5">
        <div className="space-y-5 text-sm">
          <div>
            <div className={cn("mb-1", theme.muted)}>Short description</div>
            <div>{incident.short_description || "—"}</div>
          </div>

          <div>
            <div className={cn("mb-1", theme.muted)}>Details</div>
            <div className="whitespace-pre-wrap">{incident.description || "—"}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className={cn("mb-2", theme.muted)}>Status</div>
              <select
                value={incident.status || ""}
                onChange={(e) => saveField({ status: e.target.value })}
                disabled={savingUpdate}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                {statusOptions.map((status) => (
                  <option key={status.id} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={cn("mb-2", theme.muted)}>Priority</div>
              <select
                value={incident.priority || "medium"}
                onChange={(e) => saveField({ priority: e.target.value })}
                disabled={savingUpdate}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <div className={cn("mb-2", theme.muted)}>Assigned to</div>
              <select
                value={incident.assigned_to || ""}
                onChange={(e) => saveField({ assigned_to: e.target.value || null })}
                disabled={savingUpdate}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="">Unassigned</option>
                {userOptions.map((userRow) => (
                  <option key={userRow.user_id} value={userRow.user_id}>
                    {userRow.profile?.full_name || userRow.profile?.email || userRow.user_id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={cn("mb-2", theme.muted)}>Assignment group</div>
              <select
                value={incident.assignment_group_id || ""}
                onChange={(e) => saveField({ assignment_group_id: e.target.value || null })}
                disabled={savingUpdate}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="">No group</option>
                {groupOptions.map((groupRow) => (
                  <option key={groupRow.id} value={groupRow.id}>
                    {groupRow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className={cn("mb-2", theme.muted)}>Resolution notes</div>
            <textarea
              value={incident.resolution_notes || ""}
              onChange={(e) => setIncident((prev) => ({ ...prev, resolution_notes: e.target.value }))}
              onBlur={() => saveField({ resolution_notes: incident.resolution_notes || "" })}
              className={cn("min-h-[130px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
              placeholder="Add investigation outcome or resolution details..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className={cn("mb-1", theme.muted)}>Created</div>
              <div>{incident.created_at ? new Date(incident.created_at).toLocaleString() : "—"}</div>
            </div>

            <div>
              <div className={cn("mb-1", theme.muted)}>Resolved</div>
              <div>{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "—"}</div>
            </div>

            <div>
              <div className={cn("mb-1", theme.muted)}>Closed</div>
              <div>{incident.closed_at ? new Date(incident.closed_at).toLocaleString() : "—"}</div>
            </div>

            <div>
              <div className={cn("mb-1", theme.muted)}>Current ownership</div>
              <div>{assignedUserLabel}</div>
              <div className={cn("mt-1 text-xs", theme.muted)}>{assignedGroupLabel}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusChip status={incident.status} statuses={statusOptions} />
            <PriorityChip priority={incident.priority} />
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <CommentsPanel
          theme={theme}
          title="Public comments"
          icon={MessageSquare}
          comments={publicComments}
          loading={commentsLoading}
          error={commentsError}
          newComment={newPublicComment}
          setNewComment={setNewPublicComment}
          onSubmit={submitPublicComment}
          saving={savingPublicComment}
          placeholder="Add requester-visible update..."
        />

        <CommentsPanel
          theme={theme}
          title="Internal notes"
          icon={NotebookPen}
          comments={internalNotes}
          loading={commentsLoading}
          error={commentsError}
          newComment={newInternalNote}
          setNewComment={setNewInternalNote}
          onSubmit={submitInternalNote}
          saving={savingInternalNote}
          placeholder="Add internal service desk note..."
          accent="internal"
        />
      </div>

      <ActivityPanel
        theme={theme}
        activity={activity}
        loading={activityLoading}
        error={activityError}
      />
    </div>
  )
}
