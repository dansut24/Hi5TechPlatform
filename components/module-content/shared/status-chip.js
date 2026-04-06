"use client"

export default function StatusChip({ status }) {
  const s = (status || "").toLowerCase()

  let styles = "bg-slate-500/10 text-slate-400"

  if (["open", "new"].includes(s)) styles = "bg-blue-500/10 text-blue-400"
  if (["in_progress"].includes(s)) styles = "bg-amber-500/10 text-amber-400"
  if (["resolved", "closed"].includes(s)) styles = "bg-emerald-500/10 text-emerald-400"
  if (["cancelled"].includes(s)) styles = "bg-rose-500/10 text-rose-400"
  if (["pending"].includes(s)) styles = "bg-violet-500/10 text-violet-400"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status || "unknown"}
    </span>
  )
}
