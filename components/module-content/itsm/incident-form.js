"use client"

import { useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import InputShell from "@/components/module-content/shared/input-shell"

export default function ITSMIncidentForm({
  theme,
  tenantSlug,
  heading = "Raise incident",
  subtitle = "Capture a disruption with the right priority and ownership.",
  submitLabel = "Submit incident",
}) {
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

      if (!tenantSlug) {
        setError("Missing tenant context")
        return
      }

      if (!form.shortDescription.trim()) {
        setError("Short description is required")
        return
      }

      setSaving(true)

      const res = await fetch(`/api/tenant/${tenantSlug}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to create incident")
      }

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
        title={heading}
        subtitle={subtitle}
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                }
                placeholder="VPN access failing for remote users"
              />
            </div>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Priority</div>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priority: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, details: e.target.value }))
                }
                className={cn("min-h-[160px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
              />
            </div>
          </div>

          {error ? <div className="mt-4 text-sm text-rose-400">{error}</div> : null}
          {message ? <div className="mt-4 text-sm text-emerald-400">{message}</div> : null}

          <div className="mt-5 flex gap-3">
            <ActionButton theme={theme} onClick={submit} disabled={saving}>
              {saving ? "Submitting..." : submitLabel}
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
              <div
                key={label}
                className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
              >
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
