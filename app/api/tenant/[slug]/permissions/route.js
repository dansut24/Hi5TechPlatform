import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

const AVAILABLE_MODULES = [
  { key: "itsm", label: "ITSM" },
  { key: "control", label: "Control" },
  { key: "selfservice", label: "Self Service" },
  { key: "admin", label: "Admin" },
  { key: "analytics", label: "Analytics" },
  { key: "automation", label: "Automation" },
]

export async function GET(_request, { params }) {
  try {
    const { slug } = await params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

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

    const { data: groups, error: groupsError } = await access.admin
      .from("groups")
      .select(`
        id,
        name,
        description
      `)
      .eq("tenant_id", access.tenant.id)
      .order("name", { ascending: true })

    if (groupsError) throw groupsError

    const { data: userAssignments, error: userAssignmentsError } = await access.admin
      .from("module_assignments")
      .select("user_id, module_key")
      .eq("tenant_id", access.tenant.id)

    if (userAssignmentsError) throw userAssignmentsError

    const { data: groupAssignments, error: groupAssignmentsError } = await access.admin
      .from("group_module_assignments")
      .select("group_id, module_key")
      .eq("tenant_id", access.tenant.id)

    if (groupAssignmentsError) throw groupAssignmentsError

    return NextResponse.json({
      ok: true,
      tenant: access.tenant,
      modules: AVAILABLE_MODULES,
      members: members || [],
      groups: groups || [],
      userAssignments: userAssignments || [],
      groupAssignments: groupAssignments || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load permissions" },
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
    const targetType = body.targetType
    const targetId = body.targetId
    const moduleKeys = Array.isArray(body.moduleKeys) ? body.moduleKeys : []

    if (!["user", "group"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 })
    }

    if (!targetId) {
      return NextResponse.json({ error: "Missing target id" }, { status: 400 })
    }

    const validKeys = new Set(AVAILABLE_MODULES.map((m) => m.key))
    const filteredModuleKeys = [...new Set(moduleKeys)].filter((key) => validKeys.has(key))

    if (targetType === "user") {
      const { data: memberCheck, error: memberCheckError } = await access.admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", access.tenant.id)
        .eq("user_id", targetId)
        .maybeSingle()

      if (memberCheckError) throw memberCheckError
      if (!memberCheck) {
        return NextResponse.json({ error: "User is not a tenant member" }, { status: 400 })
      }

      const { error: deleteError } = await access.admin
        .from("module_assignments")
        .delete()
        .eq("tenant_id", access.tenant.id)
        .eq("user_id", targetId)

      if (deleteError) throw deleteError

      if (filteredModuleKeys.length) {
        const rows = filteredModuleKeys.map((moduleKey) => ({
          tenant_id: access.tenant.id,
          user_id: targetId,
          module_key: moduleKey,
        }))

        const { error: insertError } = await access.admin
          .from("module_assignments")
          .insert(rows)

        if (insertError) throw insertError
      }

      return NextResponse.json({ ok: true })
    }

    if (targetType === "group") {
      const { data: groupCheck, error: groupCheckError } = await access.admin
        .from("groups")
        .select("id")
        .eq("tenant_id", access.tenant.id)
        .eq("id", targetId)
        .maybeSingle()

      if (groupCheckError) throw groupCheckError
      if (!groupCheck) {
        return NextResponse.json({ error: "Group not found" }, { status: 400 })
      }

      const { error: deleteError } = await access.admin
        .from("group_module_assignments")
        .delete()
        .eq("tenant_id", access.tenant.id)
        .eq("group_id", targetId)

      if (deleteError) throw deleteError

      if (filteredModuleKeys.length) {
        const rows = filteredModuleKeys.map((moduleKey) => ({
          tenant_id: access.tenant.id,
          group_id: targetId,
          module_key: moduleKey,
        }))

        const { error: insertError } = await access.admin
          .from("group_module_assignments")
          .insert(rows)

        if (insertError) throw insertError
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save permissions" },
      { status: 500 }
    )
  }
}
