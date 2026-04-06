"use client"

import { useEffect, useState } from "react"

export default function ClientOnlyChart({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[280px] w-full min-w-0" />
  }

  return <div className="h-[280px] w-full min-w-0">{children}</div>
}
