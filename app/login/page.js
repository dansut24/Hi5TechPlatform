import LoginPage from "@/components/auth/login-page"
import { themeMap } from "@/lib/themes"

export default function LoginRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  return <LoginPage theme={theme} />
}
