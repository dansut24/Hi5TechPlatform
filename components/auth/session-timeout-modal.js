"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Clock3 } from "lucide-react"
import { cn } from "@/components/shared-ui"

export default function SessionTimeoutModal({
  open,
  secondsRemaining = 0,
  onStaySignedIn,
  theme,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className={cn("w-full max-w-md rounded-[28px] border p-6 shadow-2xl", theme.panel)}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", theme.card)}>
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">Session expiring soon</div>
                <div className={cn("text-sm", theme.muted)}>
                  You’ve been inactive. Stay signed in to continue working.
                </div>
              </div>
            </div>

            <div className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}>
              You’ll be signed out in{" "}
              <span className="font-semibold">{secondsRemaining}</span>{" "}
              second{secondsRemaining === 1 ? "" : "s"}.
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onStaySignedIn}
                className={
                  theme.resolved === "light"
                    ? "rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
                    : "rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-950 transition hover:bg-slate-200"
                }
              >
                Stay signed in
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
