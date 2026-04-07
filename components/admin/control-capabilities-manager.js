"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import { CONTROL_CAPABILITIES } from "@/lib/permissions/control"
import ShellCard from "@/components/module-content/shared/shell-card"
import ActionButton from "@/components/module-content/shared/action-button"

function CapabilityChecklist({ selected, setSelected, theme }) {
  const toggle = (capability) => {
    setSelected((prev) =>
      prev.includes(capability)
        ? prev.filter((x) => x !== capability)
        : [...prev, capability]
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {CONTROL_CAPABILITIES.map((capability) => (
        <label
          key={capability}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 text-sm",
            theme.subCard,
            theme.line
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(capability)}
            onChange={() => toggle(capability)}
          />
          <span>{capability}</span>
        </label>
      ))}
    </div>
  )
}

export default function ControlCapabilitiesManager({ theme, tenantSlug }) {
  const [mode, setMode] = useState("users")
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [selectedCapabilities, setSelectedCapabilities] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingCapabilities, setLoadingCapabilities] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        if (!tenantSlug) return

        setLoadingList(true)
        setError("")

        const [usersRes, groupsRes] = await Promise.all([
          fetch(`/api/tenant/${tenantSlug}/users`, { cache: "no-store" }),
          fetch(`/api/tenant/${tenantSlug}/groups`, { cache: "no-store" }),
        ])

        const usersJson = await usersRes.json()
        const groupsJson = await groupsRes.json()

        if (!usersRes.ok) throw new Error(usersJson.error || "Failed to load users")
        if (!groupsRes.ok) throw new Error(groupsJson.error || "Failed to load groups")

        if (alive) {
          setUsers(usersJson.users || [])
          setGroups(groupsJson.groups || [])
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load lists")
      } finally {
        if (alive) setLoadingList(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [tenantSlug])

  useEffect(() => {
    let alive = true

    async function loadCapabilities() {
      try {
        if (!tenantSlug || !selectedId) {
          setSelectedCapabilities([])
          return
        }

        setLoadingCapabilities(true)
        setError("")
        setMessage("")

        const endpoint =
          mode === "users"
            ? `/api/tenant/${tenantSlug}/admin/control-capabilities/users/${selectedId}`
            : `/api/tenant/${tenantSlug}/admin/control-capabilities/groups/${selectedId}`

        const res = await fetch(endpoint, { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || "Failed to load capabilities")
        }

        if (alive) {
          setSelectedCapabilities(json.capabilities || [])
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load capabilities")
      } finally {
        if (alive) setLoadingCapabilities(false)
      }
    }

    loadCapabilities()

    return () => {
      alive = false
    }
  }, [tenantSlug, mode, selectedId])

  const save = async () => {
    try {
      if (!selectedId) {
        setError(`Select a ${mode === "users" ? "user" : "group"} first`)
        return
      }

      setSaving(true)
      setError("")
      setMessage("")

      const endpoint =
        mode === "users"
          ? `/api/tenant/${tenantSlug}/admin/control-capabilities/users/${selectedId}`
          : `/api/tenant/${tenantSlug}/admin/control-capabilities/groups/${selectedId}`

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilities: selectedCapabilities }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save capabilities")

      setMessage("Control capabilities updated")
    } catch (err) {
      setError(err.message || "Failed to save capabilities")
    } finally {
      setSaving(false)
    }
  }

  const currentList = mode === "users" ? users : groups

  return (
    <div className="space-y-6">
      <ShellCard theme={theme} className="p-5">
        <div className="mb-4 text-lg font-semibold">Control capability management</div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setMode("users")
              setSelectedId("")
              setSelectedCapabilities([])
            }}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm",
              mode === "users" ? theme.card : theme.subCard
            )}
          >
            Users
          </button>

          <button
            onClick={() => {
              setMode("groups")
              setSelectedId("")
              setSelectedCapabilities([])
            }}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm",
              mode === "groups" ? theme.card : theme.subCard
            )}
          >
            Groups
          </button>
        </div>

        <div className="mb-5">
          <div className={cn("mb-2 text-sm", theme.muted)}>
            Select a {mode === "users" ? "user" : "group"}
          </div>

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={cn(
              "h-11 w-full rounded-2xl border px-4 text-sm outline-none",
              theme.input
            )}
            disabled={loadingList}
          >
            <option value="">Choose…</option>
            {currentList.map((item) => (
              <option key={item.id || item.user_id} value={item.id || item.user_id}>
                {mode === "users"
                  ? item.profiles?.full_name || item.profiles?.email || item.user_id
                  : item.name}
              </option>
            ))}
          </select>
        </div>

        {loadingCapabilities ? (
          <div className="text-sm">Loading capabilities...</div>
        ) : (
          <CapabilityChecklist
            selected={selectedCapabilities}
            setSelected={setSelectedCapabilities}
            theme={theme}
          />
        )}

        {error ? <div className="mt-4 text-sm text-rose-400">{error}</div> : null}
        {message ? <div className="mt-4 text-sm text-emerald-400">{message}</div> : null}

        <div className="mt-5">
          <ActionButton theme={theme} onClick={save} disabled={saving || !selectedId}>
            {saving ? "Saving..." : "Save control capabilities"}
          </ActionButton>
        </div>
      </ShellCard>
    </div>
  )
}
