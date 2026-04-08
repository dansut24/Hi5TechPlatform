"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function Field({ label, hint, children, theme }) {
  return (
    <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
      <div className="text-sm font-medium">{label}</div>
      {hint ? <div className={cn("mt-1 text-xs", theme.muted)}>{hint}</div> : null}
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function SecuritySettings({ tenantSlug, theme }) {
  const [form, setForm] = useState({
    idle_timeout_minutes: 15,
    absolute_session_timeout_minutes: 480,
    remember_device_enabled: true,
    remember_device_days: 30,
    reauth_for_sensitive_actions: true,
    max_concurrent_sessions: 5,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug) return
        setLoading(true)
        setError("")
        setMessage("")

        const res = await fetch(`/api/tenant/${tenantSlug}/admin/security-settings`, {
          cache: "no-store",
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || "Failed to load security settings")

        if (alive && json.settings) {
          setForm({
            idle_timeout_minutes: json.settings.idle_timeout_minutes ?? 15,
            absolute_session_timeout_minutes: json.settings.absolute_session_timeout_minutes ?? 480,
            remember_device_enabled: Boolean(json.settings.remember_device_enabled),
            remember_device_days: json.settings.remember_device_days ?? 30,
            reauth_for_sensitive_actions: Boolean(json.settings.reauth_for_sensitive_actions),
            max_concurrent_sessions: json.settings.max_concurrent_sessions ?? 5,
          })
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load security settings")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  async function save() {
    try {
      setSaving(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/security-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to save security settings")

      setMessage("Security settings updated")
    } catch (err) {
      setError(err.message || "Failed to save security settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Security settings"
        subtitle="Control idle timeout, session lifetime, remembered devices, and re-auth requirements."
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
          <div className="grid gap-4 xl:grid-cols-2">
            <Field
              label="Idle timeout (minutes)"
              hint="Automatically sign the user out after this many minutes of inactivity."
              theme={theme}
            >
              <input
                type="number"
                min="1"
                max="1440"
                value={form.idle_timeout_minutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    idle_timeout_minutes: Number(e.target.value || 15),
                  }))
                }
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              />
            </Field>

            <Field
              label="Absolute session timeout (minutes)"
              hint="Force sign-out after this total session age, even if the user stays active."
              theme={theme}
            >
              <input
                type="number"
                min="5"
                max="10080"
                value={form.absolute_session_timeout_minutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    absolute_session_timeout_minutes: Number(e.target.value || 480),
                  }))
                }
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              />
            </Field>

            <Field
              label="Remember device"
              hint="Allow users to mark a browser/device as trusted for future sign-ins."
              theme={theme}
            >
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.remember_device_enabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      remember_device_enabled: e.target.checked,
                    }))
                  }
                />
                <span>Enable remembered devices</span>
              </label>
            </Field>

            <Field
              label="Remember device duration (days)"
              hint="How long a remembered device remains trusted."
              theme={theme}
            >
              <input
                type="number"
                min="1"
                max="365"
                value={form.remember_device_days}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    remember_device_days: Number(e.target.value || 30),
                  }))
                }
                disabled={!form.remember_device_enabled}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none disabled:opacity-60", theme.input)}
              />
            </Field>

            <Field
              label="Sensitive action re-authentication"
              hint="Require password confirmation before high-risk actions like permission or branding changes."
              theme={theme}
            >
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.reauth_for_sensitive_actions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reauth_for_sensitive_actions: e.target.checked,
                    }))
                  }
                />
                <span>Require re-authentication for sensitive actions</span>
              </label>
            </Field>

            <Field
              label="Max concurrent sessions"
              hint="Maximum simultaneous sessions allowed per user."
              theme={theme}
            >
              <input
                type="number"
                min="1"
                max="100"
                value={form.max_concurrent_sessions}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_concurrent_sessions: Number(e.target.value || 5),
                  }))
                }
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              />
            </Field>
          </div>
        )}
      </ShellCard>
    </div>
  )
}
