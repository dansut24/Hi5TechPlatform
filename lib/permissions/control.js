export const CONTROL_CAPABILITIES = [
  "control.access",
  "control.devices.view",
  "control.remote.use",
  "control.files.use",
  "control.shell.use",
  "control.alerts.view",
  "control.alerts.manage",
  "control.patching.view",
  "control.patching.manage",
  "control.policies.manage",
  "control.admin",
]

export function getControlCapabilities(permissionContext = {}) {
  const set = new Set()

  const moduleAssignments = Array.isArray(permissionContext.moduleAssignments)
    ? permissionContext.moduleAssignments
    : []

  const directCapabilities = Array.isArray(permissionContext.controlCapabilities)
    ? permissionContext.controlCapabilities
    : []

  const roles = Array.isArray(permissionContext.roles)
    ? permissionContext.roles
    : []

  for (const capability of directCapabilities) {
    set.add(capability)
  }

  for (const assignment of moduleAssignments) {
    if (assignment === "control") {
      set.add("control.access")
      set.add("control.devices.view")
      set.add("control.alerts.view")
      set.add("control.patching.view")
    }
  }

  if (roles.includes("control_viewer")) {
    set.add("control.access")
    set.add("control.devices.view")
    set.add("control.alerts.view")
    set.add("control.patching.view")
  }

  if (roles.includes("control_technician")) {
    set.add("control.access")
    set.add("control.devices.view")
    set.add("control.remote.use")
    set.add("control.files.use")
    set.add("control.alerts.view")
    set.add("control.patching.view")
  }

  if (roles.includes("control_engineer")) {
    set.add("control.access")
    set.add("control.devices.view")
    set.add("control.remote.use")
    set.add("control.files.use")
    set.add("control.shell.use")
    set.add("control.alerts.view")
    set.add("control.alerts.manage")
    set.add("control.patching.view")
    set.add("control.patching.manage")
  }

  if (roles.includes("control_admin")) {
    set.add("control.access")
    set.add("control.devices.view")
    set.add("control.remote.use")
    set.add("control.files.use")
    set.add("control.shell.use")
    set.add("control.alerts.view")
    set.add("control.alerts.manage")
    set.add("control.patching.view")
    set.add("control.patching.manage")
    set.add("control.policies.manage")
    set.add("control.admin")
  }

  return Array.from(set)
}

export function hasControlCapability(permissionContext = {}, capability) {
  const capabilities = getControlCapabilities(permissionContext)
  return capabilities.includes("control.admin") || capabilities.includes(capability)
}

export function canAccessControl(permissionContext = {}) {
  return hasControlCapability(permissionContext, "control.access")
}
