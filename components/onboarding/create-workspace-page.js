"use client"

import { useState } from "react"

const defaultModules = ["itsm", "control", "selfservice", "admin"]

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CreateWorkspacePage({ theme, profile }) {
  const [name, setName] = useState(profile?.full_name ? `${profile.full_name}'s Workspace` : "")
  const [slug, setSlug] = useState("")
  const [selectedModules, setSelectedModules] = useState(defaultModules)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const toggleModule = (key) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    )
  }

  const submit = async () => {
    try {
      setError("")

      if (!name.trim()) {
        setError("Workspace name is required")
        return
      }

      const finalSlug = slug.trim() || slugify(name)
      if (!finalSlug) {
        setError("Workspace slug is required")
        return
      }

      if (selectedModules.length === 0) {
        setError("Select at least one module")
        return
      }

      setSaving(true)

      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: finalSlug,
          modules: selectedModules,
          plan: "trial",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to create workspace")
      }

      window.location.href = `/tenant/${json.tenant.slug}`
    } catch (err) {
      setError(err.message || "Failed to create workspace")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Create your workspace</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Start your 14-day trial and provision your first tenant workspace.
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-4">
              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Workspace name</div>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slug) setSlug(slugify(e.target.value))
                  }}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="Acme MSP"
                />
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Workspace slug</div>
                <input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="acme-msp"
                />
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Modules</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["itsm", "ITSM"],
                    ["control", "Control"],
                    ["selfservice", "SelfService"],
                    ["admin", "Admin"],
                    ["analytics", "Analytics"],
                    ["automation", "Automation"],
                  ].map(([key, label]) => {
                    const selected = selectedModules.includes(key)

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleModule(key)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected ? theme.selected : `${theme.card} ${theme.hover}`
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error ? <div className="text-sm text-rose-400">{error}</div> : null}

              <button
                onClick={submit}
                disabled={saving}
                className={
                  theme.resolved === "light"
                    ? "rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white disabled:opacity-60"
                    : "rounded-2xl bg-white px-5 py-3 text-sm text-slate-950 disabled:opacity-60"
                }
              >
                {saving ? "Creating workspace..." : "Create workspace and start trial"}
              </button>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-lg font-semibold">Trial summary</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                Your workspace will be provisioned with a 14-day trial and owner access.
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className={`rounded-2xl border p-4 ${theme.card}`}>
                  <div className={theme.muted}>Workspace</div>
                  <div className="mt-1 font-medium">{name || "—"}</div>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.card}`}>
                  <div className={theme.muted}>Slug</div>
                  <div className="mt-1 font-medium">{slug || slugify(name) || "—"}</div>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.card}`}>
                  <div className={theme.muted}>Modules</div>
                  <div className="mt-1 font-medium">
                    {selectedModules.length ? selectedModules.join(", ") : "—"}
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.card}`}>
                  <div className={theme.muted}>Plan</div>
                  <div className="mt-1 font-medium">Trial (14 days)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
