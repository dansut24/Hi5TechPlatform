"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import CommentsPanel from "@/components/module-content/shared/comments-panel"
import ActivityPanel from "@/components/module-content/shared/activity-panel"
import StatusChip from "@/components/module-content/shared/status-chip"
import PriorityChip from "@/components/module-content/shared/priority-chip"

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

  const loadActivity = async () => {
    const res = await fetch(`/api/tenant/${tenantSlug}/activity/incident/${id}`, {
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load activity")
    setActivity(json.activity || [])
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")

        const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/incidents/${id}`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || "Failed to load incident")
        setIncident(json.incident)
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

        const res = await fetch(
          `/api/tenant/${tenantSlug}/selfservice/incidents/${id}/comments`,
          { cache: "no-store" }
        )
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

      const res = await fetch(
        `/api/tenant/${tenantSlug}/selfservice/incidents/${id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newComment }),
        }
      )

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

  if (loading) return <div className="text-sm">Loading incident...</div>
  if (error) return <div className="text-sm text-rose-400">{error}</div>
  if (!incident) return null

  return (
    <div className="space-y-6">
      <SectionTitle theme={theme} title={incident.number} subtitle="Incident details" />

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
        </div>
      </ShellCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <CommentsPanel
          theme={theme}
          title="Incident comments"
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
          title="Incident activity"
          activity={activity}
          loading={activityLoading}
          error={activityError}
        />
      </div>
    </div>
  )
}
