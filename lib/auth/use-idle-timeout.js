"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export default function useIdleTimeout({
  enabled = true,
  idleTimeoutMs,
  warningDurationMs,
  onWarn,
  onTimeout,
}) {
  const warnTimerRef = useRef(null)
  const timeoutTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const onWarnRef = useRef(onWarn)
  const onTimeoutRef = useRef(onTimeout)

  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  useEffect(() => {
    onWarnRef.current = onWarn
  }, [onWarn])

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

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

  const clearAllTimers = useCallback(() => {
    if (warnTimerRef.current) {
      window.clearTimeout(warnTimerRef.current)
      warnTimerRef.current = null
    }

    if (timeoutTimerRef.current) {
      window.clearTimeout(timeoutTimerRef.current)
      timeoutTimerRef.current = null
    }

    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const closeWarning = useCallback(() => {
    setWarningOpen(false)
    setSecondsRemaining(0)

    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const openWarning = useCallback(() => {
    setWarningOpen(true)
    setSecondsRemaining(Math.ceil(safeWarningDurationMs / 1000))
    onWarnRef.current?.()

    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current)
    }

    const warningEndsAt = Date.now() + safeWarningDurationMs

    countdownIntervalRef.current = window.setInterval(() => {
      const remainingMs = warningEndsAt - Date.now()
      const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
      setSecondsRemaining(nextSeconds)
    }, 250)
  }, [safeWarningDurationMs])

  const scheduleTimers = useCallback(() => {
    clearAllTimers()
    closeWarning()

    warnTimerRef.current = window.setTimeout(() => {
      openWarning()
    }, safeIdleTimeoutMs - safeWarningDurationMs)

    timeoutTimerRef.current = window.setTimeout(() => {
      closeWarning()
      onTimeoutRef.current?.()
    }, safeIdleTimeoutMs)
  }, [clearAllTimers, closeWarning, openWarning, safeIdleTimeoutMs, safeWarningDurationMs])

  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    scheduleTimers()
  }, [scheduleTimers])

  useEffect(() => {
    if (!enabled) {
      clearAllTimers()
      closeWarning()
      return
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return

      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed >= safeIdleTimeoutMs) {
        closeWarning()
        onTimeoutRef.current?.()
        return
      }

      registerActivity()
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ]

    events.forEach((eventName) =>
      window.addEventListener(eventName, registerActivity, { passive: true })
    )
    document.addEventListener("visibilitychange", handleVisibilityChange)

    lastActivityRef.current = Date.now()
    scheduleTimers()

    return () => {
      clearAllTimers()
      events.forEach((eventName) =>
        window.removeEventListener(eventName, registerActivity, { passive: true })
      )
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [
    enabled,
    clearAllTimers,
    closeWarning,
    registerActivity,
    safeIdleTimeoutMs,
    scheduleTimers,
  ])

  const staySignedIn = useCallback(() => {
    lastActivityRef.current = Date.now()
    scheduleTimers()
  }, [scheduleTimers])

  return {
    warningOpen,
    secondsRemaining,
    staySignedIn,
  }
}
