export function tenantPath(slug, path = "") {
  if (!slug) return path || "/"
  if (!path) return `/tenant/${slug}`
  return `/tenant/${slug}${path.startsWith("/") ? path : `/${path}`}`
}

export function tenantModulePath(slug, module) {
  if (!slug) return `/${module}`
  return `/tenant/${slug}/${module}`
}
