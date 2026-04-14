"use client"

import { useEffect, useState } from "react"
import { Clock3, ShieldCheck } from "lucide-react"
import { cn } from "@/components/shared-ui"

function Field({ label, hint, children, theme }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {hint ? <div className={cn("mb-2 text-xs", theme.muted)}>{hint}</div> : null}
      {children}
    </div>
  )
}

export default function SessionSettingsPanel({ tenantSlug, theme }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [form, setForm] = useState({
    idle_timeout_minutes: 30,
    warning_minutes_before: 5,
    remember_device_days: 30,
    require_2fa_for_admin: false,
    require_2fa_for_control: false,
  })

  async function loadSettings() {
    try {
      setLoading(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/settings/session`, {
        cache: "no-store",
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to load session settings")

      setForm({
        idle_timeout_minutes: Number(json.settings?.idle_timeout_minutes || 30),
        warning_minutes_before: Number(json.settings?.warning_minutes_before || 5),
        remember_device_days: Number(json.settings?.remember_device_days || 30),
        require_2fa_for_admin: Boolean(json.settings?.require_2fa_for_admin),
        require_2fa_for_control: Boolean(json.settings?.require_2fa_for_control),
      })
    } catch (err) {
      setError(err.message || "Failed to load session settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantSlug) loadSettings()
  }, [tenantSlug])

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setError("")
      setMessage("")

      const payload = {
        idle_timeout_minutes: Number(form.idle_timeout_minutes),
        warning_minutes_before: Number(form.warning_minutes_before),
        remember_device_days: Number(form.remember_device_days),
        require_2fa_for_admin: Boolean(form.require_2fa_for_admin),
        require_2fa_for_control: Boolean(form.require_2fa_for_control),
      }

      const res = await fetch(`/api/tenant/${tenantSlug}/settings/session`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to save session settings")

      setMessage("Session settings saved.")
      setForm({
        idle_timeout_minutes: Number(json.settings?.idle_timeout_minutes || payload.idle_timeout_minutes),
        warning_minutes_before: Number(json.settings?.warning_minutes_before || payload.warning_minutes_before),
        remember_device_days: Number(json.settings?.remember_device_days || payload.remember_device_days),
        require_2fa_for_admin: Boolean(json.settings?.require_2fa_for_admin),
        require_2fa_for_control: Boolean(json.settings?.require_2fa_for_control),
      })
    } catch (err) {
      setError(err.message || "Failed to save session settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm">Loading session settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className={cn("rounded-[28px] border p-6 shadow-2xl backdrop-blur-2xl", theme.card)}>
        <div className="mb-4 flex items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", theme.card)}>
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-semibold">Session & timeout settings</div>
            <div className={cn("text-sm", theme.muted)}>
              Control automatic logout, warning timings, trusted device duration, and module 2FA requirements.
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Idle timeout (minutes)"
            hint="How long a user can be inactive before automatic sign out."
            theme={theme}
          >
            <input
              type="number"
              min="5"
              max="1440"
              value={form.idle_timeout_minutes}
              onChange={(e) => updateField("idle_timeout_minutes", e.target.value)}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />
          </Field>

          <Field
            label="Warning before logout (minutes)"
            hint="How long before logout the warning modal should appear."
            theme={theme}
          >
            <input
              type="number"
              min="1"
              max="1439"
              value={form.warning_minutes_before}
              onChange={(e) => updateField("warning_minutes_before", e.target.value)}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />
          </Field>

          <Field
            label="Remember device for (days)"
            hint="How long a trusted device remains remembered."
            theme={theme}
          >
            <input
              type="number"
              min="1"
              max="365"
              value={form.remember_device_days}
              onChange={(e) => updateField("remember_device_days", e.target.value)}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />
          </Field>

          <div className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Step-up authentication
            </div>

            <label className="mb-3 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.require_2fa_for_admin}
                onChange={(e) => updateField("require_2fa_for_admin", e.target.checked)}
                className="h-4 w-4"
              />
              <span>Require 2FA for Admin module</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.require_2fa_for_control}
                onChange={(e) => updateField("require_2fa_for_control", e.target.checked)}
                className="h-4 w-4"
              />
              <span>Require 2FA for Control module</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-2xl px-4 py-2.5 text-sm text-white disabled:opacity-60"
            style={{ background: "#38bdf8" }}
          >
            {saving ? "Saving..." : "Save settings"}
          </button>

          <button
            onClick={loadSettings}
            className={cn("rounded-2xl border px-4 py-2.5 text-sm transition", theme.card, theme.hover)}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
