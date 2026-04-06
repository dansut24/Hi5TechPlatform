"use client"

import { useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"
import InputShell from "@/components/module-content/shared/input-shell"

export default function ITSMRequestForm({
  theme,
  tenantSlug,
  heading = "Service request",
  subtitle = "Create a fulfilment request with approvals and notes.",
  submitLabel = "Submit request",
}) {
  const [form, setForm] = useState({
    requestType: "Software Request",
    requestedFor: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async () => {
    try {
      setSaving(true)
      setMessage("")
      setError("")

      if (!tenantSlug) {
        throw new Error("Missing tenant context")
      }

      const res = await fetch(`/api/tenant/${tenantSlug}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to create request")
      }

      setMessage(`Request ${json.request.number} created`)
      setForm({
        requestType: "Software Request",
        requestedFor: "",
        notes: "",
      })
    } catch (err) {
      setError(err.message || "Failed to create request")
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
        action={<ActionButton theme={theme} secondary>Request Template</ActionButton>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Request type</div>
              <select
                value={form.requestType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, requestType: e.target.value }))
                }
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option>Software Request</option>
                <option>Hardware Request</option>
                <option>Access Request</option>
                <option>New Starter</option>
              </select>
            </div>

            <div>
              <div className={cn("mb-2 text-sm", theme.muted)}>Requested for</div>
              <InputShell
                theme={theme}
                value={form.requestedFor}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, requestedFor: e.target.value }))
                }
                placeholder="Jamie Carter"
              />
            </div>

            <div className="md:col-span-2">
              <div className={cn("mb-2 text-sm", theme.muted)}>Notes</div>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className={cn("min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
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
          <div className="text-lg font-semibold">Request summary</div>

          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Type", form.requestType],
              ["Requested for", form.requestedFor || "—"],
              ["Notes", form.notes || "—"],
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
