"use client"

import { MessageSquare } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import ActionButton from "@/components/module-content/shared/action-button"

export default function CommentsPanel({
  theme,
  title = "Comments",
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
        <div className="text-lg font-semibold">{title}</div>
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
          placeholder="Add an update..."
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
