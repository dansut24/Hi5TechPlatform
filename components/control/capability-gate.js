"use client"

import { hasControlCapability } from "@/lib/permissions/control"

export default function ControlCapabilityGate({
  permissionContext,
  capability,
  fallback = null,
  children,
}) {
  if (!hasControlCapability(permissionContext, capability)) {
    return fallback
  }

  return children
}
