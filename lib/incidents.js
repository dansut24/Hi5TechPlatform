import { createSupabaseServerClient } from "@/lib/supabase/server"
import { bootstrapSignedInUser } from "@/lib/bootstrap-user"

function incidentNumber() {
  const stamp = Date.now().toString().slice(-6)
  const rand = Math.floor(Math.random() * 900 + 100)
  return `INC-${stamp}${rand}`
}

export async function getIncidentsForCurrentUser() {
  const context = await bootstrapSignedInUser()
  if (!context) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("incidents")
    .select("id, number, short_description, priority, status, created_at")
    .eq("tenant_id", context.tenantId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createIncidentForCurrentUser({ shortDescription, description, priority }) {
  const context = await bootstrapSignedInUser()
  if (!context) throw new Error("Not authenticated")

  const supabase = await createSupabaseServerClient()

  const payload = {
    tenant_id: context.tenantId,
    number: incidentNumber(),
    short_description: shortDescription,
    description: description || null,
    priority: (priority || "medium").toLowerCase(),
    status: "new",
    requester_id: context.user.id,
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert(payload)
    .select("id, number, short_description, priority, status, created_at")
    .single()

  if (error) throw error
  return data
}
