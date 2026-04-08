"use client"

import { useEffect, useState } from "react"
import { ArrowRight, BookOpen, ClipboardList, Plus, Ticket } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"

function PortalActionCard({ theme, title, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="group block w-full text-left">
      <ShellCard theme={theme} className="h-full p-6 transition group-hover:scale-[1.01]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">{title}</div>
            <div className={cn("mt-2 max-w-md text-sm", theme.muted)}>{description}</div>
          </div>
          <div className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className={cn("mt-6 inline-flex items-center gap-2 text-sm", theme.muted)}>
          <span>Open</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </ShellCard>
    </button>
  )
}

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
    <div className="space-y-8">
      <SectionTitle
        theme={theme}
        title="How can we help?"
        subtitle="Submit a new incident or request, then track progress below."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <PortalActionCard
          theme={theme}
          title="Submit an Incident"
          description="Report something broken, unavailable, or not working as expected."
          icon={Ticket}
          onClick={() => onNavigate?.("raise-incident", "Submit Incident")}
        />

        <PortalActionCard
          theme={theme}
          title="Submit a Request"
          description="Request software, hardware, access, onboarding help, or other services."
          icon={ClipboardList}
          onClick={() => onNavigate?.("new-request", "Submit Request")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["My incidents", summary.myIncidents],
          ["Open incidents", summary.myOpenIncidents],
          ["My requests", summary.myRequests],
          ["Open requests", summary.myOpenRequests],
        ].map(([label, value]) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className={cn("text-sm", theme.muted)}>{label}</div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "…" : value}</div>
          </ShellCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold">Recent incidents</div>
            <button
              onClick={() => onNavigate?.("tickets", "My Tickets")}
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

      <ShellCard theme={theme} className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <div className="text-lg font-semibold">Helpful articles</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "How to restore BitLocker recovery access",
            "New starter laptop provisioning workflow",
            "Troubleshooting Azure SSO loop issues",
            "VPN split tunnel support matrix",
          ].map((article) => (
            <button
              key={article}
              onClick={() => onNavigate?.("knowledge", "Knowledge")}
              className={cn("rounded-2xl border p-4 text-left text-sm", theme.subCard, theme.line)}
            >
              {article}
            </button>
          ))}
        </div>
      </ShellCard>
    </div>
  )
}
