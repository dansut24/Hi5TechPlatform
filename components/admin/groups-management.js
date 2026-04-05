"use client"

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2, Users } from "lucide-react";
import { cn } from "@/components/shared-ui";

function Card({ children, theme, className = "" }) {
  return (
    <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>
      {children}
    </div>
  );
}

export default function GroupsManagement({ tenantSlug, theme }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/tenant/${tenantSlug}/groups`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load groups");
      setGroups(json.groups || []);
      setMembers(json.members || []);
    } catch (err) {
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantSlug]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (selectedGroup) {
      setEditName(selectedGroup.name || "");
      setEditDescription(selectedGroup.description || "");
    } else {
      setEditName("");
      setEditDescription("");
    }
  }, [selectedGroup]);

  const assignedUserIds = useMemo(
    () => new Set((selectedGroup?.group_members || []).map((m) => m.user_id)),
    [selectedGroup]
  );

  async function createGroup() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/tenant/${tenantSlug}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create group");

      setNewGroupName("");
      setNewGroupDescription("");
      setMessage("Group created successfully.");
      await load();
      setSelectedGroupId(json.group.id);
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setSaving(false);
    }
  }

  async function saveGroup() {
    if (!selectedGroup) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/tenant/${tenantSlug}/groups/${selectedGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update group");

      setMessage("Group updated successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to update group");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup() {
    if (!selectedGroup) return;
    const ok = window.confirm(`Delete group "${selectedGroup.name}"?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/tenant/${tenantSlug}/groups/${selectedGroup.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete group");

      setMessage("Group deleted successfully.");
      setSelectedGroupId(null);
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete group");
    } finally {
      setSaving(false);
    }
  }

  async function addMember(userId) {
    if (!selectedGroup) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(`/api/tenant/${tenantSlug}/groups/${selectedGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add member");

      await load();
      setMessage("Member added.");
    } catch (err) {
      setError(err.message || "Failed to add member");
    }
  }

  async function removeMember(userId) {
    if (!selectedGroup) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(
        `/api/tenant/${tenantSlug}/groups/${selectedGroup.id}/members?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove member");

      await load();
      setMessage("Member removed.");
    } catch (err) {
      setError(err.message || "Failed to remove member");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Groups</h2>
          <p className={cn("mt-1 text-sm", theme.muted)}>
            Organise tenant users into groups for cleaner access management.
          </p>
        </div>

        <button
          onClick={load}
          className={cn("inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition", theme.card, theme.hover)}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <div className="space-y-6">
          <Card theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5" />
              Create group
            </div>

            <div className="space-y-4">
              <div>
                <div className={cn("mb-2 text-sm", theme.muted)}>Group name</div>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                  placeholder="Service Desk"
                />
              </div>

              <div>
                <div className={cn("mb-2 text-sm", theme.muted)}>Description</div>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
                  placeholder="Handles incidents and request fulfilment"
                />
              </div>

              <button
                onClick={createGroup}
                disabled={saving}
                className={
                  theme.resolved === "light"
                    ? "inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-60"
                    : "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-950 disabled:opacity-60"
                }
              >
                <Plus className="h-4 w-4" />
                {saving ? "Creating..." : "Create group"}
              </button>
            </div>
          </Card>

          <Card theme={theme} className="overflow-hidden">
            <div className={cn("border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
              Existing groups
            </div>

            {loading ? (
              <div className="px-5 py-6 text-sm">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="px-5 py-6 text-sm">No groups created yet.</div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    "block w-full border-b px-5 py-4 text-left text-sm transition last:border-b-0",
                    theme.line,
                    selectedGroupId === group.id ? theme.selected : theme.hover
                  )}
                >
                  <div className="font-medium">{group.name}</div>
                  <div className={cn("mt-1 text-xs", theme.muted)}>
                    {group.description || "No description"}
                  </div>
                </button>
              ))
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card theme={theme} className="p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" />
              {selectedGroup ? `Manage "${selectedGroup.name}"` : "Select a group"}
            </div>

            {!selectedGroup ? (
              <div className={cn("text-sm", theme.muted)}>
                Pick a group from the left to edit it and manage members.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className={cn("mb-2 text-sm", theme.muted)}>Group name</div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                  />
                </div>

                <div>
                  <div className={cn("mb-2 text-sm", theme.muted)}>Description</div>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveGroup}
                    disabled={saving}
                    className={
                      theme.resolved === "light"
                        ? "inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-60"
                        : "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-950 disabled:opacity-60"
                    }
                  >
                    <Save className="h-4 w-4" />
                    Save group
                  </button>

                  <button
                    onClick={deleteGroup}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 px-4 py-3 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete group
                  </button>
                </div>
              </div>
            )}
          </Card>

          {selectedGroup ? (
            <Card theme={theme} className="p-5">
              <div className="mb-4 text-lg font-semibold">Members</div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div>
                  <div className={cn("mb-3 text-sm", theme.muted)}>Current members</div>
                  <div className="space-y-2">
                    {(selectedGroup.group_members || []).length === 0 ? (
                      <div className={cn("text-sm", theme.muted)}>No members in this group.</div>
                    ) : (
                      selectedGroup.group_members.map((member) => (
                        <div key={member.id} className={cn("flex items-center justify-between rounded-2xl border p-3", theme.card)}>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {member.profiles?.full_name || member.profiles?.email || member.user_id}
                            </div>
                            <div className={cn("truncate text-xs", theme.muted)}>
                              {member.profiles?.email || "No email"}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMember(member.user_id)}
                            className="rounded-xl border border-rose-400/20 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className={cn("mb-3 text-sm", theme.muted)}>Add members</div>
                  <div className="space-y-2">
                    {members
                      .filter((member) => !assignedUserIds.has(member.user_id))
                      .map((member) => (
                        <div key={member.user_id} className={cn("flex items-center justify-between rounded-2xl border p-3", theme.card)}>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {member.profiles?.full_name || member.profiles?.email || member.user_id}
                            </div>
                            <div className={cn("truncate text-xs", theme.muted)}>
                              {member.profiles?.email || "No email"} • {member.role}
                            </div>
                          </div>
                          <button
                            onClick={() => addMember(member.user_id)}
                            className={cn("rounded-xl border px-3 py-2 text-xs transition", theme.card, theme.hover)}
                          >
                            Add
                          </button>
                        </div>
                      ))}

                    {members.filter((member) => !assignedUserIds.has(member.user_id)).length === 0 ? (
                      <div className={cn("text-sm", theme.muted)}>All tenant members are already in this group.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
