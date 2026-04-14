"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Lock, Shield, UserCheck } from "lucide-react"
import { cn } from "@/components/shared-ui"

function StatCard({ theme, icon: Icon, label, value, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-rose-300"
      : tone === "success"
        ? "text-emerald-300"
        : "text-white"

  return (
    <div className={cn("rounded-[24px] border p-4", theme.card)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border", theme.subCard, theme.line)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className={cn("text-xs uppercase tracking-wide", theme.muted)}>{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold", toneClass)}>{value}</div>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function shortenUserAgent(value) {
  const ua = String(value || "").trim()
  if (!ua) return "—"
  if (ua.length <= 80) return ua
  return `${ua.slice(0, 80)}…`
}

export default function SecurityDashboardPanel({ tenantSlug, theme }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState({
    summary: {
      totalAttempts: 0,
      failedAttempts: 0,
      successfulAttempts: 0,
      activeLockouts: 0,
    },
    lockouts: [],
    loginAttempts: [],
    authActivity: [],
  })

  async function loadDashboard() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/security-dashboard`, {
        cache: "no-store",
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to load security dashboard")

      setData({
        summary: json.summary || {
          totalAttempts: 0,
          failedAttempts: 0,
          successfulAttempts: 0,
          activeLockouts: 0,
        },
        lockouts: json.lockouts || [],
        loginAttempts: json.loginAttempts || [],
        authActivity: json.authActivity || [],
      })
    } catch (err) {
      setError(err.message || "Failed to load security dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantSlug) {
      loadDashboard()
    }
  }, [tenantSlug])

  const recentFailures = useMemo(
    () => data.loginAttempts.filter((item) => !item.success).slice(0, 10),
    [data.loginAttempts]
  )

  if (loading) {
    return <div className="text-sm">Loading security dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          theme={theme}
          icon={Shield}
          label="Total attempts"
          value={data.summary.totalAttempts}
        />
        <StatCard
          theme={theme}
          icon={AlertTriangle}
          label="Failed attempts"
          value={data.summary.failedAttempts}
          tone="danger"
        />
        <StatCard
          theme={theme}
          icon={UserCheck}
          label="Successful attempts"
          value={data.summary.successfulAttempts}
          tone="success"
        />
        <StatCard
          theme={theme}
          icon={Lock}
          label="Active lockouts"
          value={data.summary.activeLockouts}
          tone={data.summary.activeLockouts > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className={cn("rounded-[28px] border p-5 shadow-2xl backdrop-blur-2xl", theme.card)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Active lockouts</div>
              <div className={cn("text-sm", theme.muted)}>
                Emails with 5 or more failed attempts in the last 10 minutes.
              </div>
            </div>

            <button
              onClick={loadDashboard}
              className={cn("rounded-2xl border px-4 py-2 text-sm transition", theme.card, theme.hover)}
            >
              Refresh
            </button>
          </div>

          {data.lockouts.length === 0 ? (
            <div className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
              No active lockouts.
            </div>
          ) : (
            <div className="space-y-3">
              {data.lockouts.map((item) => (
                <div
                  key={item.email}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.email}</div>
                      <div className={cn("mt-1 text-xs", theme.muted)}>
                        Failed attempts in window: {item.count}
                      </div>
                    </div>
                    <div className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300">
                      Locked
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <div className="mb-3 text-lg font-semibold">Recent failed logins</div>

            {recentFailures.length === 0 ? (
              <div className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
                No recent failed attempts.
              </div>
            ) : (
              <div className="space-y-3">
                {recentFailures.map((item) => (
                  <div
                    key={item.id}
                    className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.email}</div>
                        <div className={cn("mt-1 text-xs", theme.muted)}>
                          Reason: {item.reason || "unknown"}
                        </div>
                        <div className={cn("mt-1 text-xs", theme.muted)}>
                          IP: {item.ip_address || "—"}
                        </div>
                        <div className={cn("mt-1 text-xs", theme.muted)}>
                          {shortenUserAgent(item.user_agent)}
                        </div>
                      </div>
                      <div className={cn("shrink-0 text-xs", theme.muted)}>
                        {formatDateTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={cn("rounded-[28px] border p-5 shadow-2xl backdrop-blur-2xl", theme.card)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Authentication activity</div>
              <div className={cn("text-sm", theme.muted)}>
                Recent login, 2FA, and trusted-device events.
              </div>
            </div>

            <button
              onClick={loadDashboard}
              className={cn("rounded-2xl border px-4 py-2 text-sm transition", theme.card, theme.hover)}
            >
              Refresh
            </button>
          </div>

          {data.authActivity.length === 0 ? (
            <div className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
              No authentication activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.authActivity.map((item) => (
                <div
                  key={item.id}
                  className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{item.message || item.event_type}</div>
                      <div className={cn("mt-1 text-xs", theme.muted)}>
                        Event: {item.event_type}
                      </div>
                      {item.actor_user_id ? (
                        <div className={cn("mt-1 text-xs", theme.muted)}>
                          Actor: {item.actor_user_id}
                        </div>
                      ) : null}
                      {item.metadata && Object.keys(item.metadata).length > 0 ? (
                        <pre className={cn("mt-2 overflow-auto rounded-xl border p-3 text-[11px]", theme.subCard, theme.line, theme.muted)}>
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    <div className={cn("shrink-0 text-xs", theme.muted)}>
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
