"use client"

import { useEffect, useState } from "react"
import { Plus, ClipboardList } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

export default function SelfServiceOverview({ theme, tenantSlug, onNavigate }) {
  const [summary, setSummary] = useState({
    myIncidents: 0,
    myOpenIncidents: 0,
    myRequests: 0,
    myOpenRequests: 0,
    recentIncidents: [],
    recentRequests: [],
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

        const res = await fetch(`/api/tenant/${tenantSlug}/selfservice/summary`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load self service summary")
        }

        if (alive) {
          setSummary(
            json.summary || {
              myIncidents: 0,
              myOpenIncidents: 0,
              myRequests: 0,
              myOpenRequests: 0,
              recentIncidents: [],
              recentRequests: [],
            }
          )
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load self service summary")
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
        title="Self Service"
        subtitle="Raise tickets, request services, and track your own activity."
        action={
          <div className="flex gap-2">
            <ActionButton
              theme={theme}
              onClick={() => onNavigate?.("raise-incident", "Raise Incident")}
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
              New Request
            </ActionButton>
          </div>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["My Incidents", summary.myIncidents, () => onNavigate?.("tickets", "My Incidents")],
          ["Open Incidents", summary.myOpenIncidents, () => onNavigate?.("tickets", "My Incidents")],
          ["My Requests", summary.myRequests, () => onNavigate?.("requests", "My Requests")],
          ["Open Requests", summary.myOpenRequests, () => onNavigate?.("requests", "My Requests")],
        ].map(([label, value, onClick]) => (
          <button key={label} onClick={onClick} className="text-left">
            <ShellCard theme={theme} className="p-5 transition hover:scale-[1.01]">
              <div className={cn("text-sm", theme.muted)}>{label}</div>
              <div className="mt-2 text-3xl font-semibold">{loading ? "…" : value}</div>
            </ShellCard>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Recent incidents</div>
            <button
              onClick={() => onNavigate?.("tickets", "My Incidents")}
              className={cn("text-sm", theme.muted)}
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="text-sm">Loading incidents...</div>
          ) : summary.recentIncidents.length === 0 ? (
            <div className="text-sm">No incidents raised yet.</div>
          ) : (
            <div className="space-y-3">
              {summary.recentIncidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => onNavigate?.(`incident-${incident.id}`, incident.number)}
                  className="block w-full text-left"
                >
                  <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                    <div className="text-sm font-medium">{incident.number}</div>
                    <div className={cn("mt-1 text-sm", theme.muted)}>
                      {incident.short_description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Recent requests</div>
            <button
              onClick={() => onNavigate?.("requests", "My Requests")}
              className={cn("text-sm", theme.muted)}
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="text-sm">Loading requests...</div>
          ) : summary.recentRequests.length === 0 ? (
            <div className="text-sm">No requests submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {summary.recentRequests.map((requestItem) => (
                <button
                  key={requestItem.id}
                  onClick={() => onNavigate?.(`request-${requestItem.id}`, requestItem.number)}
                  className="block w-full text-left"
                >
                  <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                    <div className="text-sm font-medium">{requestItem.number}</div>
                    <div className={cn("mt-1 text-sm", theme.muted)}>
                      {requestItem.request_type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ShellCard>
      </div>
    </div>
  )
}
