"use client"

import { useEffect, useMemo, useState } from "react"
import { History, MessageSquare, RotateCcw } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function StatusChip({ status }) {
  const s = (status || "").toLowerCase()

  let styles = "bg-slate-500/10 text-slate-400"
  if (["open", "new"].includes(s)) styles = "bg-blue-500/10 text-blue-400"
  if (["in_progress"].includes(s)) styles = "bg-amber-500/10 text-amber-400"
  if (["resolved", "closed"].includes(s)) styles = "bg-emerald-500/10 text-emerald-400"
  if (["cancelled"].includes(s)) styles = "bg-rose-500/10 text-rose-400"
  if (["pending", "on_hold", "with_third_party", "awaiting_customer"].includes(s)) {
    styles = "bg-violet-500/10 text-violet-400"
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status || "unknown"}
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
  comments = [],
  loading = false,
  error = "",
  newComment,
  setNewComment,
  onSubmit,
  saving = false,
}) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <div className="text-lg font-semibold">Comments</div>
      </div>

      {loading ? (
        <div className="text-sm">Loading comments...</div>
      ) : error ? (
        <div className="text-sm text-rose-400">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-sm">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
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
        <div className={cn("mb-2 text-sm", theme.muted)}>Add comment</div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className={cn("min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
          placeholder="Add an update or reply..."
        />
        <div className="mt-3 flex justify-end">
          <ActionButton theme={theme} onClick={onSubmit} disabled={saving}>
            {saving ? "Posting..." : "Post comment"}
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
        <div className="text-lg font-semibold">Activity</div>
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

export default function SelfServiceIncidentDetail({ theme, tenantSlug, id }) {
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState("")
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState("")
  const [newComment, setNewComment] = useState("")
  const [savingComment, setSavingComment] = useState(false)
  const [reopening, setReopening] = useState(false)

  const canReopen = useMemo(() => {
    const s = String(incident?.status || "").toLowerCase()
    return ["resolved", "closed", "cancelled"].includes(s)
  }, [incident?.status])

  const loadActivity = async () => {
    const res = await fetch(`/api/tenant/${tenantSlug}/activity/incident/${id}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load activity")
    setActivity(json.activity || [])
  }

  const loadIncident = async () => {
    const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/incidents/${id}`, { cache: "no-store" })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load incident")
    setIncident(json.incident)
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")
        await loadIncident()
      } catch (err) {
        setError(err.message || "Failed to load incident")
      } finally {
        setLoading(false)
      }
    }

    if (tenantSlug && id) load()
  }, [id, tenantSlug])

  useEffect(() => {
    async function loadComments() {
      try {
        setCommentsLoading(true)
        setCommentsError("")
        const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/incidents/${id}/comments`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load comments")
        setComments(json.comments || [])
      } catch (err) {
        setCommentsError(err.message || "Failed to load comments")
      } finally {
        setCommentsLoading(false)
      }
    }

    if (tenantSlug && id) loadComments()
  }, [id, tenantSlug])

  useEffect(() => {
    async function run() {
      try {
        setActivityLoading(true)
        setActivityError("")
        await loadActivity()
      } catch (err) {
        setActivityError(err.message || "Failed to load activity")
      } finally {
        setActivityLoading(false)
      }
    }

    if (tenantSlug && id) run()
  }, [id, tenantSlug])

  const submitComment = async () => {
    try {
      if (!newComment.trim()) return
      setSavingComment(true)
      setCommentsError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/incidents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add comment")

      setComments((prev) => [...prev, json.comment])
      setNewComment("")
      await loadActivity()
    } catch (err) {
      setCommentsError(err.message || "Failed to add comment")
    } finally {
      setSavingComment(false)
    }
  }

  const reopenIncident = async () => {
    try {
      setReopening(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/incidents/${id}/reopen`, {
        method: "POST",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to reopen incident")

      setIncident(json.incident)
      await loadActivity()
    } catch (err) {
      setError(err.message || "Failed to reopen incident")
    } finally {
      setReopening(false)
    }
  }

  if (loading) return <div className="text-sm">Loading incident...</div>
  if (error && !incident) return <div className="text-sm text-rose-400">{error}</div>
  if (!incident) return null

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title={incident.number}
        subtitle="Incident details"
        action={
          canReopen ? (
            <ActionButton theme={theme} secondary onClick={reopenIncident} disabled={reopening}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {reopening ? "Reopening..." : "Reopen incident"}
            </ActionButton>
          ) : null
        }
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

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className={cn("mb-1", theme.muted)}>Status</div>
              <StatusChip status={incident.status} />
            </div>
            <div>
              <div className={cn("mb-1", theme.muted)}>Priority</div>
              <PriorityChip priority={incident.priority} />
            </div>
            <div>
              <div className={cn("mb-1", theme.muted)}>Created</div>
              <div>{incident.created_at ? new Date(incident.created_at).toLocaleString() : "—"}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className={cn("mb-1", theme.muted)}>Resolved</div>
              <div>{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "—"}</div>
            </div>
            <div>
              <div className={cn("mb-1", theme.muted)}>Closed</div>
              <div>{incident.closed_at ? new Date(incident.closed_at).toLocaleString() : "—"}</div>
            </div>
          </div>

          <div>
            <div className={cn("mb-1", theme.muted)}>Resolution notes</div>
            <div className="whitespace-pre-wrap">{incident.resolution_notes || "—"}</div>
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <CommentsPanel
          theme={theme}
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          newComment={newComment}
          setNewComment={setNewComment}
          onSubmit={submitComment}
          saving={savingComment}
        />

        <ActivityPanel
          theme={theme}
          activity={activity}
          loading={activityLoading}
          error={activityError}
        />
      </div>
    </div>
  )
}
