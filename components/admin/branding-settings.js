"use client"

import { useState } from "react"

export default function BrandingSettings({ tenant, tenantSlug }) {
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || "")
  const [brandHex, setBrandHex] = useState(tenant.brand_hex || "#0ea5e9")
  const [brandDarkHex, setBrandDarkHex] = useState(tenant.brand_dark_hex || "")
  const [heading, setHeading] = useState(tenant.login_heading || "")
  const [message, setMessage] = useState(tenant.login_message || "")

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const save = async () => {
    setSaving(true)
    setSuccess(false)

    const res = await fetch(`/api/tenant/${tenantSlug}/branding`, {
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

    setSaving(false)
    if (res.ok) setSuccess(true)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Tenant Branding</h1>

      {/* Logo */}
      <div>
        <label className="text-sm">Logo URL</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
        {logoUrl && (
          <img src={logoUrl} className="mt-3 h-12" />
        )}
      </div>

      {/* Colours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Brand Colour</label>
          <input
            type="color"
            value={brandHex}
            onChange={(e) => setBrandHex(e.target.value)}
            className="w-full h-10 mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Dark Mode Colour (optional)</label>
          <input
            type="color"
            value={brandDarkHex}
            onChange={(e) => setBrandDarkHex(e.target.value)}
            className="w-full h-10 mt-1"
          />
        </div>
      </div>

      {/* Login text */}
      <div>
        <label className="text-sm">Login Heading</label>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
      </div>

      <div>
        <label className="text-sm">Login Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {saving ? "Saving..." : "Save Branding"}
      </button>

      {success && (
        <div className="text-green-500 text-sm">
          Branding saved successfully
        </div>
      )}
    </div>
  )
}
