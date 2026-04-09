"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

export default function CatalogCategories({ tenantSlug, theme }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  })

  async function loadCategories() {
    const res = await fetch(`/api/tenant/${tenantSlug}/admin/catalog-categories`, {
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load categories")
    setCategories(json.categories || [])
  }

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setLoading(true)
        setError("")
        await loadCategories()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load categories")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug) run()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  const createCategory = async () => {
    try {
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/catalog-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create category")

      setForm({
        name: "",
        description: "",
        sort_order: 0,
        is_active: true,
      })

      await loadCategories()
      setMessage("Category created")
    } catch (err) {
      setError(err.message || "Failed to create category")
    }
  }

  const updateCategory = async (category) => {
    try {
      setSavingId(category.id)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/catalog-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update category")

      await loadCategories()
      setMessage("Category updated")
    } catch (err) {
      setError(err.message || "Failed to update category")
    } finally {
      setSavingId("")
    }
  }

  const patchCategory = (id, key, value) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, [key]: value } : category
      )
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Catalog categories"
        subtitle="Manage the categories used to organise service catalog items."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Create category</div>

          <div className="mt-4 space-y-4">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Category name"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))}
              placeholder="Sort order"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>

            <ActionButton theme={theme} onClick={createCategory}>
              Create category
            </ActionButton>
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Existing categories</div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="text-sm">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-sm">No categories yet.</div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={category.name || ""}
                      onChange={(e) => patchCategory(category.id, "name", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <input
                      type="number"
                      value={category.sort_order ?? 0}
                      onChange={(e) => patchCategory(category.id, "sort_order", Number(e.target.value || 0))}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <textarea
                      value={category.description || ""}
                      onChange={(e) => patchCategory(category.id, "description", e.target.value)}
                      className={cn("min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2", theme.input)}
                    />

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(category.is_active)}
                        onChange={(e) => patchCategory(category.id, "is_active", e.target.checked)}
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <ActionButton
                      theme={theme}
                      onClick={() => updateCategory(category)}
                      disabled={savingId === category.id}
                    >
                      {savingId === category.id ? "Saving..." : "Save"}
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
