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

export async function POST(request, { params }) {
  try {
    const { slug, groupId } = await params;
    const access = await requireTenantAdmin(slug);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: group, error: groupError } = await admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", tenant.id)
      .single();

    if (groupError) throw groupError;

    const { data: memberCheck, error: memberCheckError } = await admin
      .from("memberships")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberCheckError) throw memberCheckError;
    if (!memberCheck) {
      return NextResponse.json({ error: "User is not a tenant member" }, { status: 400 });
    }

    const { error } = await admin
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: userId,
      });

    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to add member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug, groupId } = await params;
    const access = await requireTenantAdmin(slug);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { tenant, admin } = access;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: group, error: groupError } = await admin
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("tenant_id", tenant.id)
      .single();

    if (groupError) throw groupError;

    const { error } = await admin
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
