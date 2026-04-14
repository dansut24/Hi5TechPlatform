import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveTrustedDevice, touchTrustedDevice } from "@/lib/auth/trusted-devices"

async function getTenantAndMember(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single()

  if (!tenant) return null

  return { tenant, user }
}

export async function POST(_req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndMember(slug)

  if (!ctx) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const device = await getActiveTrustedDevice({
    tenantId: ctx.tenant.id,
    userId: ctx.user.id,
  })

  if (device?.id) {
    await touchTrustedDevice(device.id)
  }

  return NextResponse.json({ success: true })
}
