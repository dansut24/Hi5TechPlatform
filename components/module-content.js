"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ClipboardList,
  Monitor,
  Plus,
  Search,
  Shield,
  UserCircle2,
  Workflow,
} from "lucide-react"
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
import BrandingSettings from "@/components/admin/branding-settings"
import UsersManagement from "@/components/admin/users-management"
import GroupsManagement from "@/components/admin/groups-management";

const serviceVolume = [
  { name: "Mon", incidents: 38, requests: 24, changes: 6 },
  { name: "Tue", incidents: 42, requests: 26, changes: 8 },
  { name: "Wed", incidents: 51, requests: 29, changes: 7 },
  { name: "Thu", incidents: 47, requests: 22, changes: 10 },
  { name: "Fri", incidents: 58, requests: 31, changes: 12 },
  { name: "Sat", incidents: 24, requests: 14, changes: 3 },
  { name: "Sun", incidents: 18, requests: 9, changes: 2 },
]

const trendData = [
  { name: "W1", value: 92 },
  { name: "W2", value: 94 },
  { name: "W3", value: 93 },
  { name: "W4", value: 96 },
  { name: "W5", value: 95 },
  { name: "W6", value: 97 },
]

const knowledgeArticles = [
  "How to restore BitLocker recovery access",
  "New starter laptop provisioning workflow",
  "Troubleshooting Azure SSO loop issues",
  "VPN split tunnel support matrix",
]

function ShellCard({ children, theme, className = "" }) {
  return <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>{children}</div>
}

function SectionTitle({ title, subtitle, action, theme }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className={cn("mt-1 text-sm", theme.muted)}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

function ActionButton({ children, theme, secondary = false, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm transition disabled:opacity-60",
        secondary
          ? cn(theme.card, theme.hover, "border")
          : theme.resolved === "light"
            ? "bg-slate-950 text-white hover:bg-slate-800"
            : "bg-white text-slate-950 hover:bg-slate-200"
      )}
    >
      {children}
    </button>
  )
}

function InputShell({ theme, value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)} />
}

function ClientOnlyChart({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[280px] w-full min-w-0" />
  }

  return <div className="h-[280px] w-full min-w-0">{children}</div>
}

function ChartCard({ theme }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="mb-4">
        <div className="text-lg font-semibold">Service volume</div>
        <div className={cn("text-sm", theme.muted)}>Incident, request, and change trend over the last 7 days.</div>
      </div>
      <ClientOnlyChart>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serviceVolume}>
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
            <Bar dataKey="incidents" radius={[8, 8, 0, 0]} fill="rgba(56,189,248,0.9)" />
            <Bar dataKey="requests" radius={[8, 8, 0, 0]} fill="rgba(168,85,247,0.85)" />
            <Bar dataKey="changes" radius={[8, 8, 0, 0]} fill="rgba(34,197,94,0.85)" />
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
        <div className={cn("text-sm", theme.muted)}>Rolling service target compliance.</div>
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
            <Line type="monotone" dataKey="value" stroke="rgba(56,189,248,0.95)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ClientOnlyChart>
    </ShellCard>
  )
}

function ITSMDashboard({ theme }) {
  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Operations overview"
        subtitle="Real-time service desk, change, asset, and SLA insight across the platform."
        action={
          <div className="flex gap-2">
            <ActionButton theme={theme}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </ActionButton>
            <ActionButton theme={theme} secondary>
              <ClipboardList className="mr-2 h-4 w-4" />
              Service Request
            </ActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Open Incidents", "SLA Breach Risk", "Pending Changes", "Healthy Assets"].map((label, i) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className={cn("text-sm", theme.muted)}>{label}</div>
            <div className="mt-2 text-3xl font-semibold">{[184, 23, 41, "96.2%"][i]}</div>
          </ShellCard>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <ChartCard theme={theme} />
        <TrendCard theme={theme} />
      </div>
    </div>
  )
}

function ITSMIncidents({ theme }) {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/incidents", { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load incidents")
        if (alive) setRows(json.incidents || [])
      } catch (err) {
        if (alive) setError(err.message || "Failed to load incidents")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      rows.filter((incident) =>
        `${incident.number} ${incident.short_description} ${incident.priority} ${incident.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [rows, query]
  )

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Incident management"
        subtitle="Track, prioritise, and resolve operational disruption with SLA visibility."
        action={
          <ActionButton theme={theme}>
            <Plus className="mr-2 h-4 w-4" />
            Create Incident
          </ActionButton>
        }
      />

      <ShellCard theme={theme} className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr,200px,auto]">
          <div className="relative">
            <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", theme.muted)} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents..."
              className={cn("h-11 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none", theme.input)}
            />
          </div>
          <InputShell theme={theme} placeholder="Priority filter" />
          <ActionButton theme={theme} secondary>
            Advanced
          </ActionButton>
        </div>
      </ShellCard>

      <ShellCard theme={theme} className="overflow-hidden">
        <div className={cn("grid grid-cols-[140px,1fr,120px,140px,160px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
          <div>Number</div>
          <div>Short description</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading incidents...</div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-rose-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-6 text-sm">No incidents found.</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className={cn("grid grid-cols-[140px,1fr,120px,140px,160px] gap-4 border-b px-5 py-4 text-sm last:border-b-0", theme.line)}>
              <div className="font-medium">{item.number}</div>
              <div>{item.short_description}</div>
              <div className="capitalize">{item.priority}</div>
              <div className="capitalize">{item.status}</div>
              <div>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </ShellCard>
    </div>
  )
}

function IncidentForm({ theme }) {
  const [form, setForm] = useState({
    shortDescription: "",
    details: "",
    priority: "medium",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async () => {
    try {
      setMessage("")
      setError("")

      if (!form.shortDescription.trim()) {
        setError("Short description is required")
        return
      }

      setSaving(true)

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create incident")

      setMessage(`Incident ${json.incident.number} created`)
      setForm({
        shortDescription: "",
        details: "",
        priority: "medium",
      })
    } catch (err) {
      setError(err.message || "Failed to create incident")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Raise incident"
        subtitle="Capture a disruption with the right priority and ownership."
        action={<ActionButton theme={theme} secondary>Save Draft</ActionButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className={cn("mb-2 text-sm", theme.muted)}>Short description</div>
              <InputShell
                theme={theme}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="VPN access failing for remote users"
              />
            </div>
            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Priority</div>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className={cn("mb-2 text-sm", theme.muted)}>Details</div>
              <textarea
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className={cn("min-h-[160px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
              />
            </div>
          </div>

          {error ? <div className="mt-4 text-sm text-rose-400">{error}</div> : null}
          {message ? <div className="mt-4 text-sm text-emerald-400">{message}</div> : null}

          <div className="mt-5 flex gap-3">
            <ActionButton theme={theme} onClick={submit} disabled={saving}>
              {saving ? "Submitting..." : "Submit incident"}
            </ActionButton>
            <ActionButton theme={theme} secondary>
              Cancel
            </ActionButton>
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Preview</div>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Short description", form.shortDescription || "—"],
              ["Priority", form.priority],
              ["Details", form.details || "—"],
            ].map(([label, value]) => (
              <div key={label} className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={theme.muted}>{label}</div>
                <div className="mt-1 whitespace-pre-wrap">{value}</div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </div>
  )
}

function ServiceRequestForm({ theme }) {
  const [form, setForm] = useState({ requestType: "Software Request", requestedFor: "", notes: "" })

  return (
    <div className="space-y-6">
      <SectionTitle theme={theme} title="Service request" subtitle="Create a fulfilment request with approvals and notes." action={<ActionButton theme={theme} secondary>Request Template</ActionButton>} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><div className={cn("mb-2 text-sm", theme.muted)}>Request type</div><select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })} className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}><option>Software Request</option><option>Hardware Request</option><option>Access Request</option><option>New Starter</option></select></div>
            <div><div className={cn("mb-2 text-sm", theme.muted)}>Requested for</div><InputShell theme={theme} value={form.requestedFor} onChange={(e) => setForm({ ...form, requestedFor: e.target.value })} placeholder="Jamie Carter" /></div>
            <div className="md:col-span-2"><div className={cn("mb-2 text-sm", theme.muted)}>Notes</div><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={cn("min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)} /></div>
          </div>
          <div className="mt-5 flex gap-3"><ActionButton theme={theme}>Submit request</ActionButton><ActionButton theme={theme} secondary>Cancel</ActionButton></div>
        </ShellCard>
        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Request summary</div>
          <div className="mt-4 space-y-3 text-sm">
            {[["Type", form.requestType], ["Requested for", form.requestedFor || "—"], ["Notes", form.notes || "—"]].map(([label, value]) => (
              <div key={label} className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
                <div className={theme.muted}>{label}</div>
                <div className="mt-1 whitespace-pre-wrap">{value}</div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </div>
  )
}

function GenericWorkspace({ title, subtitle, items, icon: Icon, theme }) {
  return (
    <div className="space-y-6">
      <SectionTitle theme={theme} title={title} subtitle={subtitle} action={<ActionButton theme={theme}><Plus className="mr-2 h-4 w-4" />Create</ActionButton>} />
      <ShellCard theme={theme} className="p-5">
        <div className="mb-4 flex items-center gap-3"><Icon className="h-5 w-5" /><div className="text-lg font-semibold">{title}</div></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item} className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>{item}</div>)}</div>
      </ShellCard>
    </div>
  )
}

export default function ModuleContent({ moduleId, activeNav, theme, tenantSlug, tenantData }) {
  if (moduleId === "itsm") {
    if (activeNav === "dashboard") return <ITSMDashboard theme={theme} />
    if (activeNav === "incidents") return <ITSMIncidents theme={theme} />
    if (activeNav === "requests") return <ServiceRequestForm theme={theme} />
    if (activeNav === "changes") return <GenericWorkspace theme={theme} title="Change management" subtitle="Plan risk, approvals, implementation windows, and backout plans." items={["CAB schedule", "Approval gates", "Implementation plan", "Backout plan"]} icon={Workflow} />
    if (activeNav === "problems") return <GenericWorkspace theme={theme} title="Problem management" subtitle="Root cause analysis, known errors, and proactive prevention." items={["Known errors", "RCA workbench", "Trend correlation", "Problem backlog"]} icon={AlertTriangle} />
    if (activeNav === "assets") return <GenericWorkspace theme={theme} title="Assets" subtitle="Endpoints, servers, and estate insight." items={["DC-SQL-01", "FW-EDGE-02", "LON-LT-1844", "APP-ERP-03"]} icon={Monitor} />
    if (activeNav === "knowledge") return <GenericWorkspace theme={theme} title="Knowledge" subtitle="Search and publish helpful documentation." items={knowledgeArticles} icon={BookOpen} />
    if (activeNav === "reports") return <GenericWorkspace theme={theme} title="Reports" subtitle="Operational reporting and insights." items={["Service volume", "SLA trends", "Team performance", "Backlog analysis"]} icon={BarChart3} />
    return <IncidentForm theme={theme} />
  }

  if (moduleId === "control") return <GenericWorkspace theme={theme} title="Control workspace" subtitle="Devices, monitoring, remote tools, jobs, and patching." items={["Device overview", "Remote tools", "Patch compliance", "Alert queue"]} icon={Monitor} />
  if (moduleId === "selfservice") return <GenericWorkspace theme={theme} title="SelfService" subtitle="End-user support, requests, and knowledge." items={["Raise incident", "Request software", "Request hardware", "Search knowledge"]} icon={UserCircle2} />

      if (moduleId === "admin") {
    if (activeNav === "users") {
      return (
        <UsersManagement
          tenantSlug={tenantSlug}
          theme={theme}
        />
      );
    }

    if (activeNav === "groups") {
      return (
        <GroupsManagement
          tenantSlug={tenantSlug}
          theme={theme}
        />
      );
    }

    if (activeNav === "branding") {
      return (
        <BrandingSettings
          tenant={tenantData}
          tenantSlug={tenantSlug}
          theme={theme}
        />
      );
    }

    return (
      <GenericWorkspace
        theme={theme}
        title="Admin console"
        subtitle="Tenants, users, security, branding, and configuration."
        items={["Users", "Groups", "Security policies", "Branding"]}
        icon={Shield}
      />
    );
  }

  if (moduleId === "analytics") return <GenericWorkspace theme={theme} title="Analytics" subtitle="KPIs, trends, and forecasting." items={["MTTR", "CSAT", "SLA", "Capacity"]} icon={BarChart3} />
  return <GenericWorkspace theme={theme} title="Automation Hub" subtitle="Workflows, triggers, and recent runs." items={["VIP escalation", "Onboarding flow", "Patch reminder", "Access approval"]} icon={Workflow} />
}
