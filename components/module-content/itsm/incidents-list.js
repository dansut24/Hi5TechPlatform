"use client"

import { useEffect, useState } from "react"
import ShellCard from "../shared/shell-card"
import SectionTitle from "../shared/section-title"
import StatusChip from "../shared/status-chip"

export default function ITSMIncidentsList({ theme, tenantSlug, onNavigate }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!tenantSlug) return
    fetch(`/api/tenant/${tenantSlug}/incidents`)
      .then((r) => r.json())
      .then((j) => setRows(j.incidents || []))
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle title="Incidents" theme={theme} />

      <ShellCard theme={theme}>
        {rows.map((i) => (
          <div
            key={i.id}
            onClick={() => onNavigate?.(`itsm-incident-${i.id}`, i.number)}
            className="p-4 border-b cursor-pointer hover:bg-white/5"
          >
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{i.number}</div>
                <div className="text-sm opacity-60">{i.short_description}</div>
              </div>
              <StatusChip status={i.status} />
            </div>
          </div>
        ))}
      </ShellCard>
    </div>
  )
}
