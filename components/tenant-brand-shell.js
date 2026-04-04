"use client"

export default function TenantBrandShell({ branding, children }) {
  return (
    <div
      style={branding?.cssVars || {}}
      className="min-h-screen"
    >
      {children}
    </div>
  )
}
