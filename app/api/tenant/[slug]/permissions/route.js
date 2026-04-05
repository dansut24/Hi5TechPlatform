import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const AVAILABLE_MODULES = [
  { key: "itsm", label: "ITSM" },
  { key: "control", label: "Control" },
  { key: "selfservice", label: "Self Service" },
  { key: "admin", label: "Admin" },
  { key: "analytics", label: "Analytics" },
  { key: "automation", label: "Automation" },
];

async function requireTenantAdmin(slug) {
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return { error: "Not authenticated", status: 401 };

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (tenantError) throw tenantError;

  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return { tenant, admin };
}

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const access = await requireTenantAdmin(slug);

    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;

    const { data: members, error: membersError } = await admin
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
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true });

    if (membersError) throw membersError;

    const { data: groups, error: groupsError } = await admin
      .from("groups")
      .select(`
        id,
        name,
        description
      `)
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true });

    if (groupsError) throw groupsError;

    const { data: userAssignments, error: userAssignmentsError } = await admin
      .from("module_assignments")
      .select("user_id, module_key")
      .eq("tenant_id", tenant.id);

    if (userAssignmentsError) throw userAssignmentsError;

    const { data: groupAssignments, error: groupAssignmentsError } = await admin
      .from("group_module_assignments")
      .select("group_id, module_key")
      .eq("tenant_id", tenant.id);

    if (groupAssignmentsError) throw groupAssignmentsError;

    return NextResponse.json({
      ok: true,
      tenant,
      modules: AVAILABLE_MODULES,
      members: members || [],
      groups: groups || [],
      userAssignments: userAssignments || [],
      groupAssignments: groupAssignments || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const access = await requireTenantAdmin(slug);

    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;
    const body = await request.json();

    const targetType = body.targetType;
    const targetId = body.targetId;
    const moduleKeys = Array.isArray(body.moduleKeys) ? body.moduleKeys : [];

    if (!["user", "group"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    if (!targetId) {
      return NextResponse.json({ error: "Missing target id" }, { status: 400 });
    }

    const validKeys = new Set(AVAILABLE_MODULES.map((m) => m.key));
    const filteredModuleKeys = [...new Set(moduleKeys)].filter((key) => validKeys.has(key));

    if (targetType === "user") {
      const { data: memberCheck, error: memberCheckError } = await admin
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", tenant.id)
        .eq("user_id", targetId)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;
      if (!memberCheck) {
        return NextResponse.json({ error: "User is not a tenant member" }, { status: 400 });
      }

      const { error: deleteError } = await admin
        .from("module_assignments")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("user_id", targetId);

      if (deleteError) throw deleteError;

      if (filteredModuleKeys.length) {
        const rows = filteredModuleKeys.map((moduleKey) => ({
          tenant_id: tenant.id,
          user_id: targetId,
          module_key: moduleKey,
        }));

        const { error: insertError } = await admin
          .from("module_assignments")
          .insert(rows);

        if (insertError) throw insertError;
      }

      return NextResponse.json({ ok: true });
    }

    if (targetType === "group") {
      const { data: groupCheck, error: groupCheckError } = await admin
        .from("groups")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("id", targetId)
        .maybeSingle();

      if (groupCheckError) throw groupCheckError;
      if (!groupCheck) {
        return NextResponse.json({ error: "Group not found" }, { status: 400 });
      }

      const { error: deleteError } = await admin
        .from("group_module_assignments")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("group_id", targetId);

      if (deleteError) throw deleteError;

      if (filteredModuleKeys.length) {
        const rows = filteredModuleKeys.map((moduleKey) => ({
          tenant_id: tenant.id,
          group_id: targetId,
          module_key: moduleKey,
        }));

        const { error: insertError } = await admin
          .from("group_module_assignments")
          .insert(rows);

        if (insertError) throw insertError;
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save permissions" },
      { status: 500 }
    );
  }
}
