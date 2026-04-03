import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient()
    const admin = getSupabaseAdminClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const name = body.name?.trim()
    const slug = slugify(body.slug || body.name || "")
    const modules = Array.isArray(body.modules) ? body.modules : []
    const plan = body.plan === "trial" ? "trial" : "trial"

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
    }

    if (!slug) {
      return NextResponse.json({ error: "Workspace slug is required" }, { status: 400 })
    }

    if (modules.length === 0) {
      return NextResponse.json({ error: "Select at least one module" }, { status: 400 })
    }

    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({ error: "User already belongs to a workspace" }, { status: 400 })
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        name,
        slug,
        status: "trial",
        plan,
        created_by: user.id,
        trial_ends_at: trialEndsAt,
      })
      .select("id, name, slug, status, plan, trial_ends_at")
      .single()

    if (tenantError) throw tenantError

    const { error: membershipError } = await admin
      .from("memberships")
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      })

    if (membershipError) throw membershipError

    const { data: adminGroup, error: groupError } = await admin
      .from("groups")
      .insert({
        tenant_id: tenant.id,
        name: "Workspace Admins",
        description: "Default administrative group",
      })
      .select("id")
      .single()

    if (groupError) throw groupError

    const { error: groupMemberError } = await admin
      .from("group_members")
      .insert({
        group_id: adminGroup.id,
        user_id: user.id,
      })

    if (groupMemberError) throw groupMemberError

    const moduleRows = modules.map((moduleKey) => ({
      tenant_id: tenant.id,
      user_id: user.id,
      module_key: moduleKey,
    }))

    const { error: moduleError } = await admin
      .from("module_assignments")
      .upsert(moduleRows, {
        onConflict: "tenant_id,user_id,module_key",
      })

    if (moduleError) throw moduleError

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create workspace" },
      { status: 500 }
    )
  }
}
