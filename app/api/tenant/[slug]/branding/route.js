import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req, { params }) {
  const { slug } = params
  const body = await req.json()

  const supabase = await getSupabaseServerClient()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("tenants")
    .update(body)
    .eq("id", tenant.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
