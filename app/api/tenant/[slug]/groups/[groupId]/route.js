import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function PATCH(request, { params }) {
  try {
    const { slug, groupId } = await params
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

    const { data: groupCheck, error: groupCheckError } = await access.admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", access.tenant.id)
      .single()

    if (groupCheckError) throw groupCheckError

    const { data: updated, error } = await access.admin
      .from("groups")
      .update({
        name,
        description,
      })
      .eq("id", groupCheck.id)
      .eq("tenant_id", access.tenant.id)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, group: updated })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update group" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { slug, groupId } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { error } = await access.admin
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("tenant_id", access.tenant.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete group" },
      { status: 500 }
    )
  }
}
