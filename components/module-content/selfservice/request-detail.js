"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import CommentsPanel from "@/components/module-content/shared/comments-panel"
import ActivityPanel from "@/components/module-content/shared/activity-panel"
import StatusChip from "@/components/module-content/shared/status-chip"

export default function SelfServiceRequestDetail({ theme, tenantSlug, id }) {
  const [requestItem, setRequestItem] = useState(null)
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
    const res = await fetch(`/api/tenant/${tenantSlug}/activity/request/${id}`, {
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

        const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/requests/${id}`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || "Failed to load request")
        setRequestItem(json.request)
      } catch (err) {
        setError(err.message || "Failed to load request")
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
          `/api/tenant/${tenantSlug}/selfservice/requests/${id}/comments`,
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
        `/api/tenant/${tenantSlug}/selfservice/requests/${id}/comments`,
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

  if (loading) return <div className="text-sm">Loading request...</div>
  if (error) return <div className="text-sm text-rose-400">{error}</div>
  if (!requestItem) return null

  return (
    <div className="space-y-6">
      <SectionTitle theme={theme} title={requestItem.number} subtitle="Request details" />

      <ShellCard theme={theme} className="p-5">
        <div className="space-y-5 text-sm">
          <div>
            <div className={cn("mb-1", theme.muted)}>Request type</div>
            <div>{requestItem.request_type || "—"}</div>
          </div>

          <div>
            <div className={cn("mb-1", theme.muted)}>Requested for</div>
            <div>{requestItem.requested_for || "—"}</div>
          </div>

          <div>
            <div className={cn("mb-1", theme.muted)}>Notes</div>
            <div className="whitespace-pre-wrap">{requestItem.notes || "—"}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className={cn("mb-1", theme.muted)}>Status</div>
              <StatusChip status={requestItem.status} />
            </div>
            <div>
              <div className={cn("mb-1", theme.muted)}>Created</div>
              <div>{requestItem.created_at ? new Date(requestItem.created_at).toLocaleString() : "—"}</div>
            </div>
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <CommentsPanel
          theme={theme}
          title="Request comments"
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
          title="Request activity"
          activity={activity}
          loading={activityLoading}
          error={activityError}
        />
      </div>
    </div>
  )
}
