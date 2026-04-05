"use client"

import { useEffect, useMemo, useState } from "react";
import { Lock, RefreshCw, Save, Shield } from "lucide-react";
import { cn } from "@/components/shared-ui";

function Card({ children, theme, className = "" }) {
  return (
    <div className={cn("rounded-[28px] border shadow-2xl backdrop-blur-2xl", theme.card, className)}>
      {children}
    </div>
  );
}

function ToggleCell({ checked, onChange, theme }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "h-9 w-full rounded-xl border text-sm transition",
        checked ? theme.selected : cn(theme.card, theme.hover)
      )}
    >
      {checked ? "✓" : "—"}
    </button>
  );
}

export default function ModulePermissions({ tenantSlug, theme }) {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modules, setModules] = useState([]);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [groupAssignments, setGroupAssignments] = useState([]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/tenant/${tenantSlug}/permissions`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load permissions");

      setModules(json.modules || []);
      setMembers(json.members || []);
      setGroups(json.groups || []);
      setUserAssignments(json.userAssignments || []);
      setGroupAssignments(json.groupAssignments || []);
    } catch (err) {
      setError(err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantSlug]);

  const userMap = useMemo(() => {
    const map = new Map();
    for (const row of userAssignments) {
      if (!map.has(row.user_id)) map.set(row.user_id, new Set());
      map.get(row.user_id).add(row.module_key);
    }
    return map;
  }, [userAssignments]);

  const groupMap = useMemo(() => {
    const map = new Map();
    for (const row of groupAssignments) {
      if (!map.has(row.group_id)) map.set(row.group_id, new Set());
      map.get(row.group_id).add(row.module_key);
    }
    return map;
  }, [groupAssignments]);

  async function saveTarget(targetType, targetId, moduleKeys) {
    try {
      setSavingKey(`${targetType}:${targetId}`);
      setError("");
      setMessage("");

      const res = await fetch(`/api/tenant/${tenantSlug}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          moduleKeys,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save permissions");

      setMessage("Permissions updated.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to save permissions");
    } finally {
      setSavingKey("");
    }
  }

  function toggleUserModule(userId, moduleKey) {
    const current = new Set(userMap.get(userId) || []);
    if (current.has(moduleKey)) current.delete(moduleKey);
    else current.add(moduleKey);
    saveTarget("user", userId, [...current]);
  }

  function toggleGroupModule(groupId, moduleKey) {
    const current = new Set(groupMap.get(groupId) || []);
    if (current.has(moduleKey)) current.delete(moduleKey);
    else current.add(moduleKey);
    saveTarget("group", groupId, [...current]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Module Permissions</h2>
          <p className={cn("mt-1 text-sm", theme.muted)}>
            Control module access directly for users and groups.
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

      <Card theme={theme} className="p-5">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5" />
          How this works
        </div>
        <div className={cn("space-y-1 text-sm", theme.muted)}>
          <div>• Direct user access grants modules to a specific user.</div>
          <div>• Group access grants modules to everyone in that group.</div>
          <div>• Later, route and UI visibility can be locked using the same data.</div>
        </div>
      </Card>

      <Card theme={theme} className="overflow-hidden">
        <div className={cn("border-b px-5 py-4 text-sm font-semibold", theme.line)}>
          User permissions
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading user permissions...</div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[860px]"
              style={{ gridTemplateColumns: `minmax(260px,1.8fr) repeat(${modules.length}, minmax(90px,1fr))` }}
            >
              <div className={cn("border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
                User
              </div>
              {modules.map((module) => (
                <div
                  key={module.key}
                  className={cn("border-b px-3 py-4 text-center text-xs uppercase tracking-wide", theme.line, theme.muted2)}
                >
                  {module.label}
                </div>
              ))}

              {members.map((member) => {
                const profile = member.profiles;
                const assigned = userMap.get(member.user_id) || new Set();
                const isSaving = savingKey === `user:${member.user_id}`;

                return (
                  <>
                    <div
                      key={`${member.user_id}-meta`}
                      className={cn("border-b px-5 py-4", theme.line)}
                    >
                      <div className="truncate text-sm font-medium">
                        {profile?.full_name || profile?.email || member.user_id}
                      </div>
                      <div className={cn("truncate text-xs", theme.muted)}>
                        {profile?.email || "No email"} • {member.role}
                      </div>
                    </div>

                    {modules.map((module) => (
                      <div
                        key={`${member.user_id}-${module.key}`}
                        className={cn("border-b px-3 py-3", theme.line)}
                      >
                        <ToggleCell
                          checked={assigned.has(module.key)}
                          onChange={() => toggleUserModule(member.user_id, module.key)}
                          theme={theme}
                        />
                      </div>
                    ))}
                  </>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card theme={theme} className="overflow-hidden">
        <div className={cn("border-b px-5 py-4 text-sm font-semibold", theme.line)}>
          Group permissions
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm">Loading group permissions...</div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[860px]"
              style={{ gridTemplateColumns: `minmax(260px,1.8fr) repeat(${modules.length}, minmax(90px,1fr))` }}
            >
              <div className={cn("border-b px-5 py-4 text-xs uppercase tracking-wide", theme.line, theme.muted2)}>
                Group
              </div>
              {modules.map((module) => (
                <div
                  key={module.key}
                  className={cn("border-b px-3 py-4 text-center text-xs uppercase tracking-wide", theme.line, theme.muted2)}
                >
                  {module.label}
                </div>
              ))}

              {groups.map((group) => {
                const assigned = groupMap.get(group.id) || new Set();

                return (
                  <>
                    <div
                      key={`${group.id}-meta`}
                      className={cn("border-b px-5 py-4", theme.line)}
                    >
                      <div className="truncate text-sm font-medium">{group.name}</div>
                      <div className={cn("truncate text-xs", theme.muted)}>
                        {group.description || "No description"}
                      </div>
                    </div>

                    {modules.map((module) => (
                      <div
                        key={`${group.id}-${module.key}`}
                        className={cn("border-b px-3 py-3", theme.line)}
                      >
                        <ToggleCell
                          checked={assigned.has(module.key)}
                          onChange={() => toggleGroupModule(group.id, module.key)}
                          theme={theme}
                        />
                      </div>
                    ))}
                  </>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
