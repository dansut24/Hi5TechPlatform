import AppShell from "@/components/app-shell"
import { bootstrapSignedInUser } from "@/lib/bootstrap-user"

export default async function SelectModulePage() {
  await bootstrapSignedInUser()
  return <AppShell initialView="modules" />
}
