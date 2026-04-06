"use client"

import { useEffect, useState } from "react"
import ShellCard from "../shared/shell-card"

export default function ITSMRequestsList({ tenantSlug, theme, onNavigate }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetch(`/api/tenant/${tenantSlug}/service-requests`)
      .then((r) => r.json())
      .then((j) => setRows(j.requests || []))
  }, [tenantSlug])

  return (
    <ShellCard theme={theme}>
      {rows.map((r) => (
        <div
          key={r.id}
          onClick={() => onNavigate?.(`itsm-request-${r.id}`, r.number)}
        >
          {r.number}
        </div>
      ))}
    </ShellCard>
  )
}
