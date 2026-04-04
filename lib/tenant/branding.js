function clampHex(value, fallback) {
  if (!value || typeof value !== "string") return fallback
  const trimmed = value.trim()
  return /^#([0-9a-fA-F]{6})$/.test(trimmed) ? trimmed : fallback
}

export function getTenantBranding(tenant) {
  const brandHex = clampHex(tenant?.brand_hex, "#38bdf8")
  const brandDarkHex = clampHex(tenant?.brand_dark_hex, "#0f172a")

  return {
    logoUrl: tenant?.logo_url || "",
    brandHex,
    brandDarkHex,
    loginHeading: tenant?.login_heading || "",
    loginMessage: tenant?.login_message || "",
    cssVars: {
      "--tenant-brand": brandHex,
      "--tenant-brand-dark": brandDarkHex,
      "--tenant-brand-rgb": hexToRgbString(brandHex),
      "--tenant-brand-dark-rgb": hexToRgbString(brandDarkHex),
    },
  }
}

function hexToRgbString(hex) {
  const safe = hex.replace("#", "")
  const r = Number.parseInt(safe.slice(0, 2), 16)
  const g = Number.parseInt(safe.slice(2, 4), 16)
  const b = Number.parseInt(safe.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}
