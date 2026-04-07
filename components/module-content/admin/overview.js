"use client"

import { useEffect, useState } from "react"
import { Mail, Palette, Plus, Shield, UserCircle2, Users, Layers3 } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function AdminActionCard({ theme, title, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="text-left">
      <ShellCard theme={theme} className="h-full p-5 transition hover:scale-[1.01]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{title}</div>
            <div className={cn("mt-1 text-sm", theme.muted)}>{description}</div>
          </div>
          <div className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </ShellCard>
    </button>
  )
}

export default function AdminOverview({ theme, tenantSlug, onNavigate }) {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingInvites: 0,
    groups: 0,
    directAssignments: 0,
    groupAssignments: 0,
    brandingConfigured: false,
    recentInvites: [],
    recentGroups: [],
    recentUsers: [],
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

        const res = await fetch(`/api/tenant/${tenantSlug}/admin/summary`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load admin summary")
        }

        if (alive) {
          setSummary(
            json.summary || {
              totalUsers: 0,
              activeUsers: 0,
              pendingInvites: 0,
              groups: 0,
              directAssignments: 0,
              groupAssignments: 0,
              brandingConfigured: false,
              recentInvites: [],
              recentGroups: [],
              recentUsers: [],
            }
          )
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load admin summary")
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
        title="Admin console"
        subtitle="Tenant users, groups, permissions, invites, branding, and control access at a glance."
        action={
          <ActionButton theme={theme}>
            <Plus className="mr-2 h-4 w-4" />
            New action
          </ActionButton>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Users", summary.totalUsers, Users],
          ["Active Users", summary.activeUsers, UserCircle2],
          ["Pending Invites", summary.pendingInvites, Mail],
          ["Groups", summary.groups, Layers3],
        ].map(([label, value, Icon]) => (
          <ShellCard key={label} theme={theme} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className={cn("text-sm", theme.muted)}>{label}</div>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "…" : value}</div>
          </ShellCard>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Direct module assignments</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? "…" : summary.directAssignments}</div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Group module assignments</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? "…" : summary.groupAssignments}</div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className={cn("text-sm", theme.muted)}>Branding status</div>
          <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <Palette className="h-5 w-5" />
            {loading ? "…" : summary.brandingConfigured ? "Configured" : "Not configured"}
          </div>
        </ShellCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminActionCard
          theme={theme}
          title="Users"
          description="Manage tenant users and membership roles."
          icon={Users}
          onClick={() => onNavigate?.("users", "Users")}
        />

        <AdminActionCard
          theme={theme}
          title="Groups"
          description="Organise staff into reusable access groups."
          icon={Layers3}
          onClick={() => onNavigate?.("groups", "Groups")}
        />

        <AdminActionCard
          theme={theme}
          title="Module Permissions"
          description="Control access to ITSM, Control, Self Service, Admin, and more."
          icon={Shield}
          onClick={() => onNavigate?.("permissions", "Module Permissions")}
        />

        <AdminActionCard
          theme={theme}
          title="Control Permissions"
          description="Manage RMM capabilities like remote access, shell, files, alerts, and patching."
          icon={Shield}
          onClick={() => onNavigate?.("control-capabilities", "Control Permissions")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 text-lg font-semibold">Recent users</div>
          {loading ? (
            <div className="text-sm">Loading users...</div>
          ) : summary.recentUsers.length === 0 ? (
            <div className="text-sm">No users found.</div>
          ) : (
            <div className="space-y-3">
              {summary.recentUsers.map((item, index) => (
                <div
                  key={`${item.id || index}`}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="text-sm font-medium">
                    {item.profiles?.full_name || item.profiles?.email || "Unknown user"}
                  </div>
                  <div className={cn("mt-1 text-xs", theme.muted)}>
                    {item.profiles?.email || "No email"} • {item.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 text-lg font-semibold">Recent invites</div>
          {loading ? (
            <div className="text-sm">Loading invites...</div>
          ) : summary.recentInvites.length === 0 ? (
            <div className="text-sm">No invites found.</div>
          ) : (
            <div className="space-y-3">
              {summary.recentInvites.map((item) => (
                <div
                  key={item.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="text-sm font-medium">{item.email}</div>
                  <div className={cn("mt-1 text-xs capitalize", theme.muted)}>
                    {item.role} • {item.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="mb-4 text-lg font-semibold">Recent groups</div>
          {loading ? (
            <div className="text-sm">Loading groups...</div>
          ) : summary.recentGroups.length === 0 ? (
            <div className="text-sm">No groups found.</div>
          ) : (
            <div className="space-y-3">
              {summary.recentGroups.map((item) => (
                <div
                  key={item.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </ShellCard>
      </div>
    </div>
  )
}
