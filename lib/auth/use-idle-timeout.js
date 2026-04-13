"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export default function useIdleTimeout({
  enabled = true,
  idleTimeoutMs,
  warningDurationMs,
  onWarn,
  onTimeout,
}) {
  const warnTimerRef = useRef(null)
  const timeoutTimerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  const safeIdleTimeoutMs = useMemo(() => {
    if (!Number.isFinite(idleTimeoutMs) || idleTimeoutMs <= 0) return 30 * 60 * 1000
    return idleTimeoutMs
  }, [idleTimeoutMs])

  const safeWarningDurationMs = useMemo(() => {
    if (
      !Number.isFinite(warningDurationMs) ||
      warningDurationMs <= 0 ||
      warningDurationMs >= safeIdleTimeoutMs
    ) {
      return 5 * 60 * 1000
    }
    return warningDurationMs
  }, [warningDurationMs, safeIdleTimeoutMs])

  useEffect(() => {
    return () => {
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
      if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setWarningOpen(false)
      setSecondsRemaining(0)
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
      if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current)
      return
    }

    function clearTimers() {
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
      if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current)
    }

    function scheduleTimers() {
      clearTimers()

      warnTimerRef.current = window.setTimeout(() => {
        setWarningOpen(true)
        setSecondsRemaining(Math.ceil(safeWarningDurationMs / 1000))
        onWarn?.()
      }, safeIdleTimeoutMs - safeWarningDurationMs)

      timeoutTimerRef.current = window.setTimeout(() => {
        setWarningOpen(false)
        setSecondsRemaining(0)
        onTimeout?.()
      }, safeIdleTimeoutMs)
    }

    function registerActivity() {
      lastActivityRef.current = Date.now()
      if (warningOpen) {
        setWarningOpen(false)
        setSecondsRemaining(0)
      }
      scheduleTimers()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastActivityRef.current
        if (elapsed >= safeIdleTimeoutMs) {
          setWarningOpen(false)
          setSecondsRemaining(0)
          onTimeout?.()
          return
        }
        registerActivity()
      }
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ]

    events.forEach((eventName) => window.addEventListener(eventName, registerActivity, { passive: true }))
    document.addEventListener("visibilitychange", handleVisibilityChange)

    scheduleTimers()

    return () => {
      clearTimers()
      events.forEach((eventName) =>
        window.removeEventListener(eventName, registerActivity, { passive: true })
      )
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, safeIdleTimeoutMs, safeWarningDurationMs, warningOpen, onWarn, onTimeout])

  useEffect(() => {
    if (!warningOpen) return

    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [warningOpen])

  const staySignedIn = () => {
    lastActivityRef.current = Date.now()
    setWarningOpen(false)
    setSecondsRemaining(0)

    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current)
    if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current)

    warnTimerRef.current = window.setTimeout(() => {
      setWarningOpen(true)
      setSecondsRemaining(Math.ceil(safeWarningDurationMs / 1000))
      onWarn?.()
    }, safeIdleTimeoutMs - safeWarningDurationMs)

    timeoutTimerRef.current = window.setTimeout(() => {
      setWarningOpen(false)
      setSecondsRemaining(0)
      onTimeout?.()
    }, safeIdleTimeoutMs)
  }

  return {
    warningOpen,
    secondsRemaining,
    staySignedIn,
  }
}
