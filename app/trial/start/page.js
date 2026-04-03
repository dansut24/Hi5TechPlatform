import { themeMap } from "@/lib/themes"
import TrialStartPage from "@/components/trial/trial-start-page"

export default function TrialStartRoutePage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }
  return <TrialStartPage theme={theme} />
}
