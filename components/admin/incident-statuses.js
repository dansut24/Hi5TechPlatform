"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

const STATUS_CATEGORIES = ["open", "pending", "resolved", "closed"]

export default function IncidentStatuses({ tenantSlug, theme }) {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    key: "",
    label: "",
    category: "open",
    color: "",
    sort_order: 0,
    is_active: true,
    pauses_sla: false,
    is_resolved: false,
    is_closed: false,
  })

  async function loadStatuses() {
    const res = await fetch(`/api/tenant/${tenantSlug}/admin/incident-statuses`, {
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load statuses")
    setStatuses(json.statuses || [])
  }

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setLoading(true)
        setError("")
        await loadStatuses()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load statuses")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug) run()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  const createStatus = async () => {
    try {
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/incident-statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create status")

      setForm({
        key: "",
        label: "",
        category: "open",
        color: "",
        sort_order: 0,
        is_active: true,
        pauses_sla: false,
        is_resolved: false,
        is_closed: false,
      })

      await loadStatuses()
      setMessage("Incident status created")
    } catch (err) {
      setError(err.message || "Failed to create status")
    }
  }

  const updateStatus = async (status) => {
    try {
      setSavingId(status.id)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/incident-statuses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update status")

      await loadStatuses()
      setMessage("Incident status updated")
    } catch (err) {
      setError(err.message || "Failed to update status")
    } finally {
      setSavingId("")
    }
  }

  const patchStatus = (id, key, value) => {
    setStatuses((prev) =>
      prev.map((status) =>
        status.id === id ? { ...status, [key]: value } : status
      )
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Incident statuses"
        subtitle="Create your own incident statuses, including pause-style statuses like On Hold or With 3rd Party."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Create status</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={form.key}
              onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="key e.g. with_third_party"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <input
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Label"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            >
              {STATUS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="Color token"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))}
              placeholder="Sort order"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.pauses_sla}
                onChange={(e) => setForm((prev) => ({ ...prev, pauses_sla: e.target.checked }))}
              />
              <span>Pauses SLA</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_resolved}
                onChange={(e) => setForm((prev) => ({ ...prev, is_resolved: e.target.checked }))}
              />
              <span>Marks resolved</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_closed}
                onChange={(e) => setForm((prev) => ({ ...prev, is_closed: e.target.checked }))}
              />
              <span>Marks closed</span>
            </label>
          </div>

          <div className="mt-4">
            <ActionButton theme={theme} onClick={createStatus}>
              Create status
            </ActionButton>
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Existing statuses</div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="text-sm">Loading statuses...</div>
            ) : statuses.length === 0 ? (
              <div className="text-sm">No statuses found.</div>
            ) : (
              statuses.map((status) => (
                <div
                  key={status.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={status.key || ""}
                      onChange={(e) => patchStatus(status.id, "key", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <input
                      value={status.label || ""}
                      onChange={(e) => patchStatus(status.id, "label", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <select
                      value={status.category || "open"}
                      onChange={(e) => patchStatus(status.id, "category", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    >
                      {STATUS_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      value={status.color || ""}
                      onChange={(e) => patchStatus(status.id, "color", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <input
                      type="number"
                      value={status.sort_order ?? 0}
                      onChange={(e) => patchStatus(status.id, "sort_order", Number(e.target.value || 0))}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
                    />

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(status.is_active)}
                        onChange={(e) => patchStatus(status.id, "is_active", e.target.checked)}
                      />
                      <span>Active</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(status.pauses_sla)}
                        onChange={(e) => patchStatus(status.id, "pauses_sla", e.target.checked)}
                      />
                      <span>Pauses SLA</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(status.is_resolved)}
                        onChange={(e) => patchStatus(status.id, "is_resolved", e.target.checked)}
                      />
                      <span>Marks resolved</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(status.is_closed)}
                        onChange={(e) => patchStatus(status.id, "is_closed", e.target.checked)}
                      />
                      <span>Marks closed</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <ActionButton
                      theme={theme}
                      onClick={() => updateStatus(status)}
                      disabled={savingId === status.id}
                    >
                      {savingId === status.id ? "Saving..." : "Save"}
                    </ActionButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </ShellCard>
      </div>
    </div>
  )
}
