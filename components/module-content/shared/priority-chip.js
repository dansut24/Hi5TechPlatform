"use client"

export default function PriorityChip({ priority }) {
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
