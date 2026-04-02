import "./globals.css"

export const metadata = {
  title: "Hi5Tech Platform",
  description: "ITSM, RMM, SelfService, Analytics, and Automation platform",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
