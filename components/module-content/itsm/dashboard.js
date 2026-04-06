"use client"

import { useEffect, useState } from "react"
import ShellCard from "../shared/shell-card"
import SectionTitle from "../shared/section-title"
import ActionButton from "../shared/action-button"

export default function ITSMDashboard({ theme, tenantSlug }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!tenantSlug) return

    fetch(`/api/tenant/${tenantSlug}/itsm/summary`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.summary || {}))
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Operations overview"
        subtitle="Live service desk metrics"
        theme={theme}
        action={<ActionButton theme={theme}>New Ticket</ActionButton>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Open Incidents", data?.openIncidents],
          ["SLA Risk", data?.breachRisk],
          ["Changes", data?.pendingChanges],
          ["Assets", data?.healthyAssets],
        ].map(([label, value]) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className="text-sm opacity-60">{label}</div>
            <div className="text-2xl font-semibold mt-2">{value ?? "—"}</div>
          </ShellCard>
        ))}
      </div>
    </div>
  )
}
