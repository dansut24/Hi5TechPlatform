import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

  return { user, tenant, admin };
}

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const access = await requireTenantAdmin(slug);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;

    const { data: groups, error: groupsError } = await admin
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
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true });

    if (groupsError) throw groupsError;

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

    return NextResponse.json({
      ok: true,
      tenant,
      groups: groups || [],
      members: members || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load groups" },
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

    const name = body.name?.trim();
    const description = body.description?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const { data: existing } = await admin
      .from("groups")
      .select("id")
      .eq("tenant_id", tenant.id)
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 400 });
    }

    const { data: group, error } = await admin
      .from("groups")
      .insert({
        tenant_id: tenant.id,
        name,
        description,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, group });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
