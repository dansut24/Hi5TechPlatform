"use client"

import { useEffect, useState } from "react"
import ShellCard from "../shared/shell-card"

export default function ITSMRequestDetail({ tenantSlug, id, theme }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`/api/tenant/${tenantSlug}/service-requests/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.request))
  }, [tenantSlug, id])

  if (!data) return null

  return <ShellCard theme={theme}>{data.number}</ShellCard>
}
