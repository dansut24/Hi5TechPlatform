import { NextResponse } from "next/server"
import { requireTenantApiAccess } from "@/lib/tenant/api-access"

export async function GET(_request, { params }) {
  try {
    const { slug } = params
    const access = await requireTenantApiAccess(slug, "admin", { adminOnly: true })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const tenantId = access.tenant.id

    const [
      membershipsRes,
      invitesRes,
      groupsRes,
      moduleAssignmentsRes,
      groupModuleAssignmentsRes,
      tenantRes,
    ] = await Promise.all([
      access.admin
        .from("memberships")
        .select("id, status, role, created_at, profiles:user_id(full_name,email)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),

      access.admin
        .from("tenant_invites")
        .select("id, email, role, status, created_at, expires_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),

      access.admin
        .from("groups")
        .select("id, name, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),

      access.admin
        .from("module_assignments")
        .select("id, module_key")
        .eq("tenant_id", tenantId),

      access.admin
        .from("group_module_assignments")
        .select("id, module_key")
        .eq("tenant_id", tenantId),

      access.admin
        .from("tenants")
        .select("logo_url, brand_hex, brand_dark_hex, login_heading, login_message")
        .eq("id", tenantId)
        .single(),
    ])

    if (membershipsRes.error) throw membershipsRes.error
    if (invitesRes.error) throw invitesRes.error
    if (groupsRes.error) throw groupsRes.error
    if (moduleAssignmentsRes.error) throw moduleAssignmentsRes.error
    if (groupModuleAssignmentsRes.error) throw groupModuleAssignmentsRes.error
    if (tenantRes.error) throw tenantRes.error

    const memberships = membershipsRes.data || []
    const invites = invitesRes.data || []
    const groups = groupsRes.data || []
    const moduleAssignments = moduleAssignmentsRes.data || []
    const groupModuleAssignments = groupModuleAssignmentsRes.data || []
    const tenant = tenantRes.data || {}

    const activeUsers = memberships.filter(
      (m) => (m.status || "active").toLowerCase() === "active"
    ).length

    const pendingInvites = invites.filter(
      (invite) => (invite.status || "").toLowerCase() === "pending"
    ).length

    const brandingConfigured = Boolean(
      tenant.logo_url ||
      tenant.brand_hex ||
      tenant.brand_dark_hex ||
      tenant.login_heading ||
      tenant.login_message
    )

    return NextResponse.json({
      ok: true,
      summary: {
        totalUsers: memberships.length,
        activeUsers,
        pendingInvites,
        groups: groups.length,
        directAssignments: moduleAssignments.length,
        groupAssignments: groupModuleAssignments.length,
        brandingConfigured,
        recentInvites: invites.slice(0, 5),
        recentGroups: groups.slice(0, 5),
        recentUsers: memberships.slice(0, 5),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load admin summary" },
      { status: 500 }
    )
  }
}
