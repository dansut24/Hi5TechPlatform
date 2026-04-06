"use client"

import { useEffect, useState } from "react"
import { Plus, ClipboardList } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import ClientOnlyChart from "@/components/module-content/shared/client-only-chart"

const trendData = [
  { name: "W1", value: 92 },
  { name: "W2", value: 94 },
  { name: "W3", value: 93 },
  { name: "W4", value: 96 },
  { name: "W5", value: 95 },
  { name: "W6", value: 97 },
]

function ChartCard({ theme, byPriority = [] }) {
  const chartData = byPriority.map((row) => ({
    name: row.priority,
    count: row.count,
  }))

  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4">
        <div className="text-lg font-semibold">Incident priority mix</div>
        <div className={cn("text-sm", theme.muted)}>
          Live tenant-scoped incident breakdown by priority.
        </div>
      </div>

      <ClientOnlyChart>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis dataKey="name" stroke="currentColor" opacity={0.45} />
            <YAxis stroke="currentColor" opacity={0.45} />
            <Tooltip
              contentStyle={{
                background: theme.resolved === "light" ? "#ffffff" : "#020617",
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: 16,
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="rgba(56,189,248,0.9)" />
          </BarChart>
        </ResponsiveContainer>
      </ClientOnlyChart>
    </ShellCard>
  )
}

function TrendCard({ theme }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4">
        <div className="text-lg font-semibold">SLA performance</div>
        <div className={cn("text-sm", theme.muted)}>
          Rolling service target compliance.
        </div>
      </div>

      <ClientOnlyChart>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis dataKey="name" stroke="currentColor" opacity={0.45} />
            <YAxis stroke="currentColor" opacity={0.45} />
            <Tooltip
              contentStyle={{
                background: theme.resolved === "light" ? "#ffffff" : "#020617",
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: 16,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="rgba(56,189,248,0.95)"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ClientOnlyChart>
    </ShellCard>
  )
}

export default function ITSMDashboard({ theme, tenantSlug, onNavigate }) {
  const [summary, setSummary] = useState({
    openIncidents: 0,
    breachRisk: 0,
    pendingChanges: 0,
    healthyAssets: "—",
    byPriority: [],
    recentIncidents: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug) return

        setLoading(true)
        setError("")

        const res = await fetch(`/api/tenant/${tenantSlug}/itsm/summary`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load ITSM summary")
        }

        if (alive) {
          setSummary(
            json.summary || {
              openIncidents: 0,
              breachRisk: 0,
              pendingChanges: 0,
              healthyAssets: "—",
              byPriority: [],
              recentIncidents: [],
            }
          )
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load ITSM summary")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [tenantSlug])

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Operations overview"
        subtitle="Real-time service desk, change, asset, and SLA insight across the platform."
        action={
          <div className="flex gap-2">
            <ActionButton
              theme={theme}
              onClick={() => onNavigate?.("new-incident", "New Incident")}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Incident
            </ActionButton>

            <ActionButton
              theme={theme}
              secondary
              onClick={() => onNavigate?.("new-request", "New Request")}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Service Request
            </ActionButton>
          </div>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open Incidents", summary.openIncidents],
          ["SLA Breach Risk", summary.breachRisk],
          ["Pending Changes", summary.pendingChanges],
          ["Healthy Assets", summary.healthyAssets],
        ].map(([label, value]) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className={cn("text-sm", theme.muted)}>{label}</div>
            <div className="mt-2 text-3xl font-semibold">
              {loading ? "…" : value}
            </div>
          </ShellCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <ChartCard theme={theme} byPriority={summary.byPriority} />
        <TrendCard theme={theme} />
      </div>

      <ShellCard theme={theme} className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">Recent incidents</div>
          <button
            onClick={() => onNavigate?.("incidents", "Incidents")}
            className={cn("text-sm", theme.muted)}
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="text-sm">Loading recent incidents...</div>
        ) : summary.recentIncidents.length === 0 ? (
          <div className="text-sm">No incidents found.</div>
        ) : (
          <div className="space-y-3">
            {summary.recentIncidents.map((incident) => (
              <button
                key={incident.id}
                onClick={() => onNavigate?.(`itsm-incident-${incident.id}`, incident.number)}
                className="block w-full text-left"
              >
                <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{incident.number}</div>
                      <div className={cn("mt-1 text-sm", theme.muted)}>
                        {incident.short_description}
                      </div>
                    </div>
                    <div className={cn("text-xs uppercase", theme.muted2)}>
                      {incident.priority}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ShellCard>
    </div>
  )
}
