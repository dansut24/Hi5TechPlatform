"use client"

import { useState } from "react"

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function TrialStartPage({ theme }) {
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    tenantName: "",
    tenantSlug: "",
    superuserEmail: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    try {
      setSaving(true)
      setError("")

      const payload = {
        ...form,
        tenantSlug: form.tenantSlug || slugify(form.tenantName),
      }

      const res = await fetch("/api/trial-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to start trial")
      }

      window.location.href = json.next
    } catch (err) {
      setError(err.message || "Failed to start trial")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className={`rounded-[28px] border p-8 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
          <div className="text-3xl font-semibold">Start your free trial</div>
          <div className={`mt-2 text-sm ${theme.muted}`}>
            Tell us about your company and choose your tenant URL.
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-4">
              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Your full name</div>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="Dan Sutton"
                />
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Company name</div>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="Hi5Tech"
                />
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Workspace / tenant name</div>
                <input
                  value={form.tenantName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tenantName: e.target.value,
                      tenantSlug: form.tenantSlug || slugify(e.target.value),
                    })
                  }
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="Hi5Tech Trial"
                />
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Tenant URL slug</div>
                <input
                  value={form.tenantSlug}
                  onChange={(e) => setForm({ ...form, tenantSlug: slugify(e.target.value) })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="hi5tech-trial"
                />
                <div className={`mt-2 text-xs ${theme.muted}`}>
                  This will become <span className="font-medium">/tenant/{form.tenantSlug || "your-slug"}</span>
                </div>
              </div>

              <div>
                <div className={`mb-2 text-sm ${theme.muted}`}>Superuser email</div>
                <input
                  value={form.superuserEmail}
                  onChange={(e) => setForm({ ...form, superuserEmail: e.target.value })}
                  className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${theme.input}`}
                  placeholder="owner@company.com"
                />
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
                {saving ? "Creating trial..." : "Next"}
              </button>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div className="text-lg font-semibold">How this works</div>
              <div className={`mt-3 space-y-3 text-sm ${theme.muted}`}>
                <div>1. You enter your workspace details.</div>
                <div>2. We send a secure setup link to the superuser email.</div>
                <div>3. The link completes tenant setup.</div>
                <div>4. The superuser sets their password.</div>
                <div>5. They are redirected to the tenant-specific login.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
