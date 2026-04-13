"use client"

import { useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function useNotificationRealtime({
  enabled = true,
  userId,
  onInsert,
  onError,
}) {
  useEffect(() => {
    if (!enabled) return
    if (!userId) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      onError?.(new Error("Missing public Supabase environment variables"))
      return
    }

    let supabase = null
    let channel = null
    let disposed = false

    try {
      supabase = createBrowserClient(url, anonKey)

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (disposed) return
            onInsert?.(payload.new)
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            onError?.(new Error("Notification realtime channel error"))
          }
        })
    } catch (error) {
      onError?.(error)
    }

    return () => {
      disposed = true

      try {
        if (supabase && channel) {
          supabase.removeChannel(channel)
        }
      } catch {}
    }
  }, [enabled, userId, onInsert, onError])
}
