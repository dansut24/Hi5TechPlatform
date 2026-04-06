"use client"

import { cn } from "@/components/shared-ui"

export default function InputShell({ theme, value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
    />
  )
}
