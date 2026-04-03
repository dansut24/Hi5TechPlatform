import RedirectPage from "@/components/auth/redirect-page"
import { themeMap } from "@/lib/themes"

export default function RedirectRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  return <RedirectPage theme={theme} />
}
