"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Sparkles } from "lucide-react"
import { cn } from "@/components/shared-ui"

function HeaderBreadcrumbs({ currentModuleTitle, navItems, activeNav, theme }) {
  const activeItem = navItems.find((item) => item.id === activeNav) || navItems[0]

  const breadcrumbs = useMemo(() => {
    const items = [currentModuleTitle]
    if (activeItem?.label) items.push(activeItem.label)
    return items
  }, [currentModuleTitle, activeItem])

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[13px] sm:text-sm">
        {breadcrumbs.map((item, index) => (
          <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? <span className={cn("shrink-0 opacity-50", theme.muted2)}>/</span> : null}
            <span
              className={cn(
                "truncate",
                index === breadcrumbs.length - 1 ? "font-medium" : theme.muted
              )}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatRelativeTime(value) {
  if (!value) return ""

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()

  if (!Number.isFinite(diffMs)) return ""

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  return date.toLocaleDateString()
}

function buildNotificationPath(tenantSlug, notification) {
  if (!tenantSlug) return null

  if (notification?.link) {
    if (notification.link.startsWith("/tenant/")) return notification.link
    return `/tenant/${tenantSlug}${notification.link}`
  }

  if (notification?.entity_type === "incident" && notification?.entity_id) {
    return `/tenant/${tenantSlug}/itsm`
  }

  return null
}

function notificationDetail(notification) {
  return notification?.body || "Open to view more details."
}

function notificationTitle(notification) {
  return notification?.title || "Notification"
}

function NotificationBell({ theme, mobile = false, tenantSlug }) {
  const router = useRouter()
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const channelRef = useRef(null)
  const supabaseRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")

  const loadNotifications = async () => {
    if (!tenantSlug) return

    try {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/tenant/${tenantSlug}/notifications`, {
        cache: "no-store",
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "Failed to load notifications")

      setNotifications(json.notifications || [])
      setUnreadCount(Number(json.unreadCount || 0))
    } catch (err) {
      setError(err.message || "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tenantSlug) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    supabaseRef.current = supabase

    let active = true

    async function init() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!active) return

      if (userError) {
        setError(userError.message || "Failed to get current user")
      }

      if (user?.id) {
        setCurrentUserId(user.id)
      }

      await loadNotifications()
    }

    init()

    return () => {
      active = false
    }
  }, [tenantSlug])

  useEffect(() => {
    if (!currentUserId || !supabaseRef.current) return

    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseRef.current
      .channel(`notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const incoming = payload.new
          setNotifications((prev) => {
            const exists = prev.some((item) => item.id === incoming.id)
            if (exists) return prev
            return [incoming, ...prev]
          })
          setUnreadCount((prev) => prev + (incoming?.is_read ? 0 : 1))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [currentUserId])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event) {
      const target = event.target
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const markRead = async ({ ids = [], markAll = false }) => {
    if (!tenantSlug) return

    const idsToMark = Array.isArray(ids) ? ids.filter(Boolean) : []
    if (!markAll && idsToMark.length === 0) return

    const previousNotifications = notifications
    const previousUnread = unreadCount
    const nowIso = new Date().toISOString()

    setNotifications((prev) =>
      prev.map((item) =>
        markAll || idsToMark.includes(item.id)
          ? { ...item, is_read: true, read_at: item.read_at || nowIso }
          : item
      )
    )

    setUnreadCount((prev) => {
      if (markAll) return 0
      const unreadToMark = previousNotifications.filter(
        (item) => idsToMark.includes(item.id) && !item.is_read
      ).length
      return Math.max(0, prev - unreadToMark)
    })

    try {
      const res = await fetch(`/api/tenant/${tenantSlug}/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToMark, markAll }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to mark notifications read")
    } catch (err) {
      setNotifications(previousNotifications)
      setUnreadCount(previousUnread)
      setError(err.message || "Failed to mark notifications read")
    }
  }

  const handleOpenToggle = async () => {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen && tenantSlug) {
      await loadNotifications()
    }
  }

  const handleNotificationClick = async (notification) => {
    const path = buildNotificationPath(tenantSlug, notification)

    if (!notification?.is_read) {
      await markRead({ ids: [notification.id] })
    }

    setOpen(false)

    if (path) {
      router.push(path)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true)
      await markRead({ markAll: true })
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpenToggle}
        className={cn(
          "relative flex items-center justify-center rounded-xl border transition",
          mobile ? "h-9 w-9 lg:h-10 lg:w-10" : "h-8 w-8 lg:h-9 lg:w-9",
          theme.card,
          theme.hover
        )}
        aria-label="Notifications"
      >
        <Bell className={mobile ? "h-4 w-4 lg:h-4.5 lg:w-4.5" : "h-3.5 w-3.5 lg:h-4 lg:w-4"} />
        {unreadCount > 0 ? (
          <>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400" />
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              mobile
                ? "absolute bottom-11 left-1/2 z-[100] w-[300px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-3xl border p-3 shadow-2xl shadow-black/40"
                : "absolute right-0 top-11 z-[100] w-[320px] rounded-3xl border p-3 shadow-2xl shadow-black/40 lg:top-12",
              theme.panel
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-2">
              <div className="text-sm font-medium">Notifications</div>
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
                className={cn(
                  "text-xs transition",
                  unreadCount === 0 ? theme.muted2 : "text-cyan-400 hover:opacity-80"
                )}
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            </div>

            {error ? (
              <div className="px-2 pb-2 text-xs text-rose-400">{error}</div>
            ) : null}

            <div className="max-h-[320px] space-y-2 overflow-auto">
              {loading ? (
                <div className="px-2 py-3 text-sm">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="px-2 py-3 text-sm">No notifications yet.</div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-left transition",
                      theme.subCard,
                      theme.line,
                      !item.is_read ? "ring-1 ring-cyan-400/30" : "",
                      theme.hover
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!item.is_read ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                          ) : null}
                          <div className="truncate text-sm font-medium">
                            {notificationTitle(item)}
                          </div>
                        </div>
                        <div className={cn("mt-1 line-clamp-2 text-xs", theme.muted)}>
                          {notificationDetail(item)}
                        </div>
                      </div>
                      <div className={cn("shrink-0 text-[11px]", theme.muted2)}>
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { NotificationBell }

export default function HeaderBar({
  theme,
  currentModuleTitle,
  navItems,
  activeNav,
  tenantSlug,
}) {
  return (
    <div
      className={cn("relative z-50 border-b backdrop-blur-xl", theme.header)}
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex h-full items-center gap-3 px-4 py-2 lg:px-6 lg:py-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border lg:h-9 lg:w-9", theme.card)}>
          <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <HeaderBreadcrumbs
            currentModuleTitle={currentModuleTitle}
            navItems={navItems}
            activeNav={activeNav}
            theme={theme}
          />
        </div>

        <div className="hidden lg:block">
          <NotificationBell theme={theme} tenantSlug={tenantSlug} />
        </div>
      </div>
    </div>
  )
}
