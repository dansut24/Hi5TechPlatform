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

export async function PATCH(request, { params }) {
  try {
    const { slug, groupId } = await params;
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

    const { data: groupCheck, error: groupCheckError } = await admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", tenant.id)
      .single();

    if (groupCheckError) throw groupCheckError;

    const { data: updated, error } = await admin
      .from("groups")
      .update({
        name,
        description,
      })
      .eq("id", groupCheck.id)
      .eq("tenant_id", tenant.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, group: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update group" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { slug, groupId } = await params;
    const access = await requireTenantAdmin(slug);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;

    const { error } = await admin
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("tenant_id", tenant.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
