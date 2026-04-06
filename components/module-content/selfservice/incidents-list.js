"use client"

import { useEffect, useState } from "react"

export default function SelfServiceIncidentsList({ tenantSlug, onNavigate }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    fetch(`/api/tenant/${tenantSlug}/incidents`)
      .then((r) => r.json())
      .then((j) => setRows(j.incidents || []))
  }, [tenantSlug])

  return rows.map((r) => (
    <div key={r.id} onClick={() => onNavigate(`incident-${r.id}`)}>
      {r.number}
    </div>
  ))
}
