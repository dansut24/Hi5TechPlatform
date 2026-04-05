import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(_request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: groups, error: groupsError } = await access.admin
      .from("groups")
      .select(`
        id,
        tenant_id,
        name,
        description,
        created_at,
        updated_at,
        group_members (
          id,
          user_id,
          profiles:user_id (
            id,
            full_name,
            email,
            initials
          )
        )
      `)
      .eq("tenant_id", access.tenant.id)
      .order("name", { ascending: true })

    if (groupsError) throw groupsError

    const { data: members, error: membersError } = await access.admin
      .from("memberships")
      .select(`
        user_id,
        role,
        status,
        profiles:user_id (
          id,
          full_name,
          email,
          initials
        )
      `)
      .eq("tenant_id", access.tenant.id)
      .order("created_at", { ascending: true })

    if (membersError) throw membersError

    return NextResponse.json({
      ok: true,
      tenant: access.tenant,
      groups: groups || [],
      members: members || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load groups" },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const name = body.name?.trim()
    const description = body.description?.trim() || null

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    const { data: existing } = await access.admin
      .from("groups")
      .select("id")
      .eq("tenant_id", access.tenant.id)
      .ilike("name", name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 400 })
    }

    const { data: group, error } = await access.admin
      .from("groups")
      .insert({
        tenant_id: access.tenant.id,
        name,
        description,
      })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, group })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create group" },
      { status: 500 }
    )
  }
}
