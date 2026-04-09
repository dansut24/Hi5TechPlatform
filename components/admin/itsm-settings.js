"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

export default function ITSMSettings({ tenantSlug, theme }) {
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({
    default_triage_group_id: "",
    send_requester_confirmation_emails: true,
    send_requester_update_emails: true,
    send_resolution_emails: true,
    auto_close_resolved_enabled: false,
    auto_close_resolved_hours: 72,
    survey_enabled: false,
    survey_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError("")
        setMessage("")

        const res = await fetch(`/api/tenant/${tenantSlug}/admin/itsm-settings`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || "Failed to load ITSM settings")

        if (alive) {
          setGroups(json.groups || [])
          setForm({
            default_triage_group_id: json.settings.default_triage_group_id || "",
            send_requester_confirmation_emails: Boolean(json.settings.send_requester_confirmation_emails),
            send_requester_update_emails: Boolean(json.settings.send_requester_update_emails),
            send_resolution_emails: Boolean(json.settings.send_resolution_emails),
            auto_close_resolved_enabled: Boolean(json.settings.auto_close_resolved_enabled),
            auto_close_resolved_hours: Number(json.settings.auto_close_resolved_hours || 72),
            survey_enabled: Boolean(json.settings.survey_enabled),
            survey_url: json.settings.survey_url || "",
          })
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load ITSM settings")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug) load()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  async function save() {
    try {
      setSaving(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/itsm-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save ITSM settings")

      setMessage("ITSM settings updated")
    } catch (err) {
      setError(err.message || "Failed to save ITSM settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="ITSM settings"
        subtitle="Configure triage routing, requester notifications, and resolution survey behaviour."
        action={
          <ActionButton theme={theme} onClick={save} disabled={loading || saving}>
            {saving ? "Saving..." : "Save settings"}
          </ActionButton>
        }
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <ShellCard theme={theme} className="p-5">
        {loading ? (
          <div className="text-sm">Loading settings...</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Default triage group</div>
              <select
                value={form.default_triage_group_id}
                onChange={(e) => setForm((prev) => ({ ...prev, default_triage_group_id: e.target.value }))}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="">No default triage group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Auto-close resolved (hours)</div>
              <input
                type="number"
                value={form.auto_close_resolved_hours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    auto_close_resolved_hours: Number(e.target.value || 72),
                  }))
                }
                disabled={!form.auto_close_resolved_enabled}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none disabled:opacity-60", theme.input)}
              />
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.send_requester_confirmation_emails}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    send_requester_confirmation_emails: e.target.checked,
                  }))
                }
              />
              <span>Send confirmation email on incident submission</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.send_requester_update_emails}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    send_requester_update_emails: e.target.checked,
                  }))
                }
              />
              <span>Send requester email updates</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.send_resolution_emails}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    send_resolution_emails: e.target.checked,
                  }))
                }
              />
              <span>Send resolution email</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.auto_close_resolved_enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    auto_close_resolved_enabled: e.target.checked,
                  }))
                }
              />
              <span>Enable auto-close after resolution</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.survey_enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    survey_enabled: e.target.checked,
                  }))
                }
              />
              <span>Enable resolution survey link</span>
            </label>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Survey URL</div>
              <input
                value={form.survey_url}
                onChange={(e) => setForm((prev) => ({ ...prev, survey_url: e.target.value }))}
                disabled={!form.survey_enabled}
                placeholder="https://example.com/survey"
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none disabled:opacity-60", theme.input)}
              />
            </div>
          </div>
        )}
      </ShellCard>
    </div>
  )
}
