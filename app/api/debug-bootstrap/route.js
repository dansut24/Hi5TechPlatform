import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const admin = getSupabaseAdminClient()

    const { data, error } = await admin
      .from("tenants")
      .insert({
        name: "Debug Workspace",
        slug: `debug-${Date.now()}`,
        status: "active",
      })
      .select("id, name, slug")
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "Unknown error" },
      { status: 500 }
    )
  }
}
