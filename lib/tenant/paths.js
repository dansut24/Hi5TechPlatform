export function tenantPath(slug, path = "") {
  if (!slug) {
    if (!path) return "/"
    return path.startsWith("/") ? path : `/${path}`
  }

  if (!path) return `/tenant/${slug}`

  return `/tenant/${slug}${path.startsWith("/") ? path : `/${path}`}`
}

export function tenantModulePath(slug, moduleKey) {
  if (!slug) return `/${moduleKey}`
  return `/tenant/${slug}/${moduleKey}`
}

export function tenantDashboardPath(slug) {
  if (!slug) return "/select-module"
  return `/tenant/${slug}/dashboard`
}

export function tenantLoginPath(slug) {
  if (!slug) return "/login"
  return `/tenant/${slug}/login`
}
