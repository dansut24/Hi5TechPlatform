import { createClient } from "@supabase/supabase-js"

let adminClient = null

export function createAdminSupabaseClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing admin Supabase configuration")
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return adminClient
}

export function getSupabaseAdminClient() {
  return createAdminSupabaseClient()
}
