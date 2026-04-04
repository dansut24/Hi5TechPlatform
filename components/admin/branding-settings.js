"use client"

import { useMemo, useState } from "react"
import { cn } from "@/components/shared-ui"

function safeHex(value, fallback) {
  return typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value)
    ? value
    : fallback
}

export default function BrandingSettings({ tenant, tenantSlug, theme }) {
  const safeTenant = tenant || {}

  const [logoUrl, setLogoUrl] = useState(safeTenant.logo_url || "")
  const [brandHex, setBrandHex] = useState(safeHex(safeTenant.brand_hex, "#0ea5e9"))
  const [brandDarkHex, setBrandDarkHex] = useState(safeHex(safeTenant.brand_dark_hex, "#0f172a"))
  const [heading, setHeading] = useState(safeTenant.login_heading || "")
  const [message, setMessage] = useState(safeTenant.login_message || "")

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const resolvedSlug = tenantSlug || safeTenant.slug || ""

  const previewTitle = useMemo(() => {
    return heading || `Welcome to ${safeTenant.name || resolvedSlug || "your workspace"}`
  }, [heading, safeTenant.name, resolvedSlug])

  const previewMessage = useMemo(() => {
    return message || "Sign in to continue to your branded workspace."
  }, [message])

  const save = async () => {
    try {
      setSaving(true)
      setSuccess(false)
      setError("")

      if (!resolvedSlug) {
        throw new Error("Missing tenant slug")
      }

      const res = await fetch(`/api/tenant/${resolvedSlug}/branding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logo_url: logoUrl,
          brand_hex: brandHex,
          brand_dark_hex: brandDarkHex,
          login_heading: heading,
          login_message: message,
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || "Failed to save branding")
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || "Failed to save branding")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenant Branding</h1>
        <p className={cn("mt-2 text-sm", theme?.muted || "text-white/70")}>
          Control logo, colours, and login messaging for this tenant workspace.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className={cn("rounded-[28px] border p-5 shadow-2xl backdrop-blur-2xl", theme?.card || "border-white/10 bg-white/5")}>
          <div className="space-y-5">
            <div>
              <label className={cn("mb-2 block text-sm", theme?.muted || "text-white/70")}>
                Logo URL
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-2xl border px-4 text-sm outline-none",
                  theme?.input || "border-white/10 bg-transparent"
                )}
                placeholder="https://example.com/logo.png"
              />
              {logoUrl ? (
                <div className="mt-3">
                  <img
                    src={logoUrl}
                    alt="Tenant logo preview"
                    className="h-14 max-w-[180px] rounded-xl object-contain"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={cn("mb-2 block text-sm", theme?.muted || "text-white/70")}>
                  Brand Colour
                </label>
                <input
                  type="color"
                  value={brandHex}
                  onChange={(e) => setBrandHex(e.target.value)}
                  className="h-12 w-full rounded-2xl border bg-transparent p-1"
                />
              </div>

              <div>
                <label className={cn("mb-2 block text-sm", theme?.muted || "text-white/70")}>
                  Dark Mode Colour
                </label>
                <input
                  type="color"
                  value={brandDarkHex}
                  onChange={(e) => setBrandDarkHex(e.target.value)}
                  className="h-12 w-full rounded-2xl border bg-transparent p-1"
                />
              </div>
            </div>

            <div>
              <label className={cn("mb-2 block text-sm", theme?.muted || "text-white/70")}>
                Login Heading
              </label>
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-2xl border px-4 text-sm outline-none",
                  theme?.input || "border-white/10 bg-transparent"
                )}
                placeholder="Welcome to your workspace"
              />
            </div>

            <div>
              <label className={cn("mb-2 block text-sm", theme?.muted || "text-white/70")}>
                Login Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={cn(
                  "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                  theme?.input || "border-white/10 bg-transparent"
                )}
                placeholder="Sign in to continue to your branded workspace."
              />
            </div>

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}
            {success ? <div className="text-sm text-emerald-400">Branding saved successfully.</div> : null}

            <button
              onClick={save}
              disabled={saving}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: brandHex }}
            >
              {saving ? "Saving..." : "Save Branding"}
            </button>
          </div>
        </div>

        <div className={cn("rounded-[28px] border p-5 shadow-2xl backdrop-blur-2xl", theme?.card || "border-white/10 bg-white/5")}>
          <div className="text-lg font-semibold">Preview</div>
          <p className={cn("mt-2 text-sm", theme?.muted || "text-white/70")}>
            A quick preview of how the tenant login experience will feel.
          </p>

          <div
            className="mt-5 rounded-[24px] border p-5"
            style={{
              borderColor: `${brandHex}33`,
              background: `linear-gradient(180deg, ${brandHex}1A, transparent)`,
            }}
          >
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-white/5">
                  <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border text-lg font-semibold"
                  style={{ borderColor: `${brandHex}55`, boxShadow: `0 0 18px ${brandHex}22` }}
                >
                  {(safeTenant.name || resolvedSlug || "T").slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <div className="text-xl font-semibold">{previewTitle}</div>
                <div className={cn("mt-1 text-sm", theme?.muted || "text-white/70")}>
                  {previewMessage}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="rounded-2xl px-4 py-3 text-sm font-medium text-white"
                style={{ background: brandHex }}
                type="button"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
