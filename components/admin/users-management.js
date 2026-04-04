"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, RefreshCw, Send, Trash2, Users } from "lucide-react"
import { cn } from "@/components/shared-ui"

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "technician", label: "Technician" },
  { value: "user", label: "User" },
]

function Card({ children, theme, className = "" }) {
  return (
    <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>
      {children}
    </div>
  )
}

export default function UsersManagement({ tenantSlug, theme }) {
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("technician")
  const [groupIds, setGroupIds] = useState([])

  async function load() {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/api/tenant/${tenantSlug}/users`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load users")
      setMembers(json.members || [])
      setInvites(json.invites || [])
      setGroups(json.groups || [])
    } catch (err) {
      setError(err.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tenantSlug])

  const pendingInvites = useMemo(
    () => invites.filter((invite) => invite.status === "pending"),
    [invites]
  )

  async function inviteUser() {
    try {
      setSaving(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          groupIds,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to invite user")

      setEmail("")
      setRole("technician")
      setGroupIds([])
      setMessage("Invite sent successfully.")
      await load()
    } catch (err) {
      setError(err.message || "Failed to invite user")
    } finally {
      setSaving(false)
    }
  }

  async function updateInvite(inviteId, action) {
    try {
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/invites/${inviteId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Failed to ${action} invite`)

      setMessage(action === "resend" ? "Invite resent." : "Invite revoked.")
      await load()
    } catch (err) {
      setError(err.message || `Failed to ${action} invite`)
    }
  }

  const toggleGroup = (groupId) => {
    setGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users & Invites</h2>
          <p className={cn("mt-1 text-sm", theme.muted)}>
            Invite users, review active members, and manage pending access.
          </p>
        </div>

        <button
          onClick={load}
          className={cn("inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition", theme.card, theme.hover)}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card theme={theme} className="p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-5 w-5" />
            Invite user
          </div>

          <div className="space-y-4">
            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              />
            </div>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Role</div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Groups</div>
              <div className="flex flex-wrap gap-2">
                {groups.length ? groups.map((group) => {
                  const selected = groupIds.includes(group.id)
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition",
                        selected ? theme.selected : cn(theme.card, theme.hover)
                      )}
                    >
                      {group.name}
                    </button>
                  )
                }) : (
                  <div className={cn("text-sm", theme.muted)}>No groups yet.</div>
                )}
              </div>
            </div>

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}
            {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

            <button
              onClick={inviteUser}
              disabled={saving}
              className={
                theme.resolved === "light"
                  ? "inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-60"
                  : "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-950 disabled:opacity-60"
              }
            >
              <Send className="h-4 w-4" />
              {saving ? "Sending..." : "Send invite"}
            </button>
          </div>
        </Card>

        <Card theme={theme} className="p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Send className="h-5 w-5" />
            Pending invites
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-sm">Loading invites...</div>
            ) : pendingInvites.length === 0 ? (
              <div className={cn("text-sm", theme.muted)}>No pending invites.</div>
            ) : (
              pendingInvites.map((invite) => (
                <div key={invite.id} className={cn("rounded-2xl border p-4", theme.card)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{invite.email}</div>
                      <div className={cn("mt-1 text-xs capitalize", theme.muted)}>
                        {invite.role} • expires {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInvite(invite.id, "resend")}
                        className={cn("rounded-xl border px-3 py-2 text-xs transition", theme.card, theme.hover)}
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => updateInvite(invite.id, "revoke")}
                        className="rounded-xl border border-rose-400/20 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card theme={theme} className="overflow-hidden">
        <div className={cn("grid grid-cols-[1.4fr,120px,120px] gap-4 border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
          <div>User</div>
          <div>Role</div>
          <div>Status</div>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading users...</div>
        ) : members.length === 0 ? (
          <div className="px-5 py-6 text-sm">No members found.</div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className={cn("grid grid-cols-[1.4fr,120px,120px] gap-4 border-b px-5 py-4 text-sm last:border-b-0", theme.line)}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {member.profiles?.full_name || member.profiles?.email || member.user_id}
                </div>
                <div className={cn("truncate text-xs", theme.muted)}>
                  {member.profiles?.email || "No email"}
                </div>
              </div>
              <div className="capitalize">{member.role}</div>
              <div className="capitalize">{member.status || "active"}</div>
            </div>
          ))
        )}
      </Card>

      <Card theme={theme} className="p-5">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5" />
          Next
        </div>
        <div className={cn("text-sm", theme.muted)}>
          Groups and module access can be layered on top of this next.
        </div>
      </Card>
    </div>
  )
}
