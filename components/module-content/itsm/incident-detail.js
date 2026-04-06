"use client"

import { useEffect, useState } from "react"
import ShellCard from "../shared/shell-card"
import CommentsPanel from "../shared/comments-panel"
import ActivityPanel from "../shared/activity-panel"

export default function ITSMIncidentDetail({ tenantSlug, id, theme }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`/api/tenant/${tenantSlug}/incidents/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.incident))
  }, [tenantSlug, id])

  if (!data) return null

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ShellCard theme={theme} className="p-5">
        <h2 className="text-xl font-semibold">{data.number}</h2>
        <p className="mt-2">{data.short_description}</p>
      </ShellCard>

      <CommentsPanel
        endpoint={`/api/tenant/${tenantSlug}/incidents/${id}/comments`}
        theme={theme}
      />

      <ActivityPanel
        endpoint={`/api/tenant/${tenantSlug}/incidents/${id}/activity`}
        theme={theme}
      />
    </div>
  )
}
