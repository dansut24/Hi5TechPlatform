"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

const PRIORITIES = ["low", "medium", "high", "critical"]

export default function CatalogItems({ tenantSlug, theme }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    category_id: "",
    template_id: "",
    name: "",
    short_description: "",
    full_description: "",
    icon: "",
    sort_order: 0,
    is_active: true,
    request_type: "Service Catalog Request",
    approval_required: false,
    default_priority: "medium",
  })

  async function loadAll() {
    const [itemsRes, categoriesRes, templatesRes] = await Promise.all([
      fetch(`/api/tenant/${tenantSlug}/admin/catalog-items`, { cache: "no-store" }),
      fetch(`/api/tenant/${tenantSlug}/admin/catalog-categories`, { cache: "no-store" }),
      fetch(`/api/tenant/${tenantSlug}/admin/request-templates`, { cache: "no-store" }),
    ])

    const itemsJson = await itemsRes.json()
    const categoriesJson = await categoriesRes.json()
    const templatesJson = await templatesRes.json()

    if (!itemsRes.ok) throw new Error(itemsJson.error || "Failed to load catalog items")
    if (!categoriesRes.ok) throw new Error(categoriesJson.error || "Failed to load categories")
    if (!templatesRes.ok) throw new Error(templatesJson.error || "Failed to load templates")

    setItems(itemsJson.items || [])
    setCategories(categoriesJson.categories || [])
    setTemplates(templatesJson.templates || [])
  }

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setLoading(true)
        setError("")
        await loadAll()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load catalog items")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug) run()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  const createItem = async () => {
    try {
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/catalog-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create item")

      setForm({
        category_id: "",
        template_id: "",
        name: "",
        short_description: "",
        full_description: "",
        icon: "",
        sort_order: 0,
        is_active: true,
        request_type: "Service Catalog Request",
        approval_required: false,
        default_priority: "medium",
      })

      await loadAll()
      setMessage("Catalog item created")
    } catch (err) {
      setError(err.message || "Failed to create item")
    }
  }

  const updateItem = async (item) => {
    try {
      setSavingId(item.id)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/catalog-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update item")

      await loadAll()
      setMessage("Catalog item updated")
    } catch (err) {
      setError(err.message || "Failed to update item")
    } finally {
      setSavingId("")
    }
  }

  const patchItem = (id, key, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Catalog items"
        subtitle="Create and manage service catalog items, categories, templates, and defaults."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Create catalog item</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Item name"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
            />

            <select
              value={form.category_id}
              onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={form.template_id}
              onChange={(e) => setForm((prev) => ({ ...prev, template_id: e.target.value }))}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            >
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            <input
              value={form.short_description}
              onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
              placeholder="Short description"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
            />

            <textarea
              value={form.full_description}
              onChange={(e) => setForm((prev) => ({ ...prev, full_description: e.target.value }))}
              placeholder="Full description"
              className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2", theme.input)}
            />

            <input
              value={form.request_type}
              onChange={(e) => setForm((prev) => ({ ...prev, request_type: e.target.value }))}
              placeholder="Request type"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <select
              value={form.default_priority}
              onChange={(e) => setForm((prev) => ({ ...prev, default_priority: e.target.value }))}
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))}
              placeholder="Sort order"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <input
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              placeholder="Icon name"
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

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.approval_required}
                onChange={(e) => setForm((prev) => ({ ...prev, approval_required: e.target.checked }))}
              />
              <span>Approval required</span>
            </label>
          </div>

          <div className="mt-4">
            <ActionButton theme={theme} onClick={createItem}>
              Create item
            </ActionButton>
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Existing items</div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="text-sm">Loading catalog items...</div>
            ) : items.length === 0 ? (
              <div className="text-sm">No catalog items yet.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={item.name || ""}
                      onChange={(e) => patchItem(item.id, "name", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
                    />

                    <select
                      value={item.category_id || ""}
                      onChange={(e) => patchItem(item.id, "category_id", e.target.value || null)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={item.template_id || ""}
                      onChange={(e) => patchItem(item.id, "template_id", e.target.value || null)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    >
                      <option value="">No template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={item.short_description || ""}
                      onChange={(e) => patchItem(item.id, "short_description", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none md:col-span-2", theme.input)}
                    />

                    <textarea
                      value={item.full_description || ""}
                      onChange={(e) => patchItem(item.id, "full_description", e.target.value)}
                      className={cn("min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2", theme.input)}
                    />

                    <input
                      value={item.request_type || ""}
                      onChange={(e) => patchItem(item.id, "request_type", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <select
                      value={item.default_priority || "medium"}
                      onChange={(e) => patchItem(item.id, "default_priority", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={item.sort_order ?? 0}
                      onChange={(e) => patchItem(item.id, "sort_order", Number(e.target.value || 0))}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <input
                      value={item.icon || ""}
                      onChange={(e) => patchItem(item.id, "icon", e.target.value)}
                      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                    />

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(item.is_active)}
                        onChange={(e) => patchItem(item.id, "is_active", e.target.checked)}
                      />
                      <span>Active</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(item.approval_required)}
                        onChange={(e) => patchItem(item.id, "approval_required", e.target.checked)}
                      />
                      <span>Approval required</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <ActionButton
                      theme={theme}
                      onClick={() => updateItem(item)}
                      disabled={savingId === item.id}
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
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
