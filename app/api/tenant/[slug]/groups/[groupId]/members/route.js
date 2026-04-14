import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function POST(request, { params }) {
  try {
    const { slug, groupId } = params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { data: group, error: groupError } = await access.admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", access.tenant.id)
      .single()

    if (groupError) throw groupError

    const { data: memberCheck, error: memberCheckError } = await access.admin
      .from("memberships")
      .select("id")
      .eq("tenant_id", access.tenant.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (memberCheckError) throw memberCheckError
    if (!memberCheck) {
      return NextResponse.json({ error: "User is not a tenant member" }, { status: 400 })
    }

    const { error } = await access.admin
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: userId,
      })

    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to add member" },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug, groupId } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { data: group, error: groupError } = await access.admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", access.tenant.id)
      .single()

    if (groupError) throw groupError

    const { error } = await access.admin
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status: 500 }
    )
  }
}
