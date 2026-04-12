import { createServerSupabaseClient } from "@/lib/supabase/server"

export const DEFAULT_ITSM_SETTINGS = {
  default_triage_group_id: null,
  send_requester_confirmation_emails: true,
  send_requester_update_emails: true,
  send_resolution_emails: true,
  auto_close_resolved_enabled: false,
  auto_close_resolved_hours: 72,
  survey_enabled: false,
  survey_url: null,
}

export async function getTenantItsmSettingsByTenantId(tenantId) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("tenant_itsm_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(1)

  if (error) throw error

  return {
    ...DEFAULT_ITSM_SETTINGS,
    ...((data && data[0]) || {}),
  }
}
