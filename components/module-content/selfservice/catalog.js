"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, Search, ShoppingBasket, Trash2 } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

function CatalogCard({ item, theme, onAdd }) {
  return (
    <ShellCard theme={theme} className="p-5">
      <div className="flex h-full flex-col">
        <div className="text-lg font-semibold">{item.name}</div>
        <div className={cn("mt-2 text-sm", theme.muted)}>
          {item.short_description || "No description"}
        </div>
        <div className="mt-4 flex-1" />
        <div className="mt-4">
          <ActionButton theme={theme} onClick={() => onAdd(item)}>
            <Plus className="mr-2 h-4 w-4" />
            Add to basket
          </ActionButton>
        </div>
      </div>
    </ShellCard>
  )
}

export default function SelfServiceCatalog({ theme, tenantSlug, onNavigate }) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [basket, setBasket] = useState([])
  const [requestedFor, setRequestedFor] = useState("")
  const [justification, setJustification] = useState("")
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
        const res = await fetch(`/api/tenant/${tenantSlug}/service-catalog`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Failed to load catalog")

        if (alive) {
          setCategories(json.categories || [])
          setItems(json.items || [])
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load catalog")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory

      const haystack = `${item.name} ${item.short_description || ""} ${item.full_description || ""}`.toLowerCase()
      const matchesQuery = haystack.includes(query.toLowerCase())

      return matchesCategory && matchesQuery
    })
  }, [items, selectedCategory, query])

  const addToBasket = (item) => {
    setBasket((prev) => {
      const existing = prev.find((entry) => entry.catalog_item_id === item.id)
      if (existing) {
        return prev.map((entry) =>
          entry.catalog_item_id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        )
      }
      return [
        ...prev,
        {
          catalog_item_id: item.id,
          item_name: item.name,
          quantity: 1,
          notes: "",
        },
      ]
    })
  }

  const updateQuantity = (catalogItemId, nextQty) => {
    if (nextQty <= 0) {
      setBasket((prev) => prev.filter((entry) => entry.catalog_item_id !== catalogItemId))
      return
    }

    setBasket((prev) =>
      prev.map((entry) =>
        entry.catalog_item_id === catalogItemId
          ? { ...entry, quantity: nextQty }
          : entry
      )
    )
  }

  const updateItemNotes = (catalogItemId, notes) => {
    setBasket((prev) =>
      prev.map((entry) =>
        entry.catalog_item_id === catalogItemId
          ? { ...entry, notes }
          : entry
      )
    )
  }

  const removeItem = (catalogItemId) => {
    setBasket((prev) => prev.filter((entry) => entry.catalog_item_id !== catalogItemId))
  }

  const submitBasket = async () => {
    try {
      setSaving(true)
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/service-catalog/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedFor,
          justification,
          items: basket,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to submit basket")

      setMessage(`Request ${json.request.number} submitted`)
      setBasket([])
      setRequestedFor("")
      setJustification("")

      if (json.request?.id) {
        onNavigate?.(`request-${json.request.id}`, json.request.number)
      }
    } catch (err) {
      setError(err.message || "Failed to submit basket")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Service catalog"
        subtitle="Browse available services and add them to your basket before submitting."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <div className="space-y-6">
          <ShellCard theme={theme} className="p-4">
            <div className="grid gap-3 md:grid-cols-[1fr,220px]">
              <div className="relative">
                <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", theme.muted)} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalog..."
                  className={cn("h-11 w-full rounded-2xl border pl-9 pr-4 text-sm outline-none", theme.input)}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </ShellCard>

          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              <div className="text-sm">Loading catalog...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-sm">No catalog items found.</div>
            ) : (
              filteredItems.map((item) => (
                <CatalogCard
                  key={item.id}
                  item={item}
                  theme={theme}
                  onAdd={addToBasket}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <ShellCard theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5" />
              <div className="text-lg font-semibold">Basket</div>
            </div>

            {basket.length === 0 ? (
              <div className="text-sm">No items added yet.</div>
            ) : (
              <div className="space-y-4">
                {basket.map((entry) => (
                  <div
                    key={entry.catalog_item_id}
                    className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium">{entry.item_name}</div>
                      <button onClick={() => removeItem(entry.catalog_item_id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(entry.catalog_item_id, entry.quantity - 1)}
                        className={cn("rounded-xl border p-2", theme.card)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="min-w-[32px] text-center text-sm">{entry.quantity}</div>
                      <button
                        onClick={() => updateQuantity(entry.catalog_item_id, entry.quantity + 1)}
                        className={cn("rounded-xl border p-2", theme.card)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      value={entry.notes}
                      onChange={(e) => updateItemNotes(entry.catalog_item_id, e.target.value)}
                      placeholder="Item notes"
                      className={cn("mt-3 min-h-[84px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
                    />
                  </div>
                ))}
              </div>
            )}
          </ShellCard>

          <ShellCard theme={theme} className="p-5">
            <div className="text-lg font-semibold">Checkout</div>

            <div className="mt-4 space-y-4">
              <div>
                <div className={cn("mb-2 text-sm", theme.muted)}>Requested for</div>
                <input
                  value={requestedFor}
                  onChange={(e) => setRequestedFor(e.target.value)}
                  placeholder="Your name or the person this is for"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />
              </div>

              <div>
                <div className={cn("mb-2 text-sm", theme.muted)}>Business justification</div>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Why is this needed?"
                  className={cn("min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
                />
              </div>

              <ActionButton
                theme={theme}
                onClick={submitBasket}
                disabled={saving || basket.length === 0}
              >
                {saving ? "Submitting..." : "Submit request"}
              </ActionButton>
            </div>
          </ShellCard>
        </div>
      </div>
    </div>
  )
}
