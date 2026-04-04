import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const DEFAULT_USER_MODULES = ["itsm", "control", "selfservice"]

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U"
}

async function ensureProfile(admin, { userId, email, fullName }) {
  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName || email,
        initials: initialsFromName(fullName, email),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (error) throw error
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient()
    const admin = getSupabaseAdminClient()
    const body = await request.json()
    const inviteId = body.inviteId

    if (!inviteId) {
      return NextResponse.json({ error: "Missing invite id" }, { status: 400 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: invite, error: inviteError } = await admin
      .from("tenant_invites")
      .select(`
        *,
        tenants!inner (
          id,
          slug,
          name
        )
      `)
      .eq("id", inviteId)
      .maybeSingle()

    if (inviteError) throw inviteError
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    if (invite.status === "revoked") {
      return NextResponse.json({ error: "Invite has been revoked" }, { status: 400 })
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    await ensureProfile(admin, {
      userId: user.id,
      email: invite.email,
      fullName: user.user_metadata?.full_name || invite.email,
    })

    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("tenant_id", invite.tenant_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!existingMembership) {
      const { error: membershipError } = await admin
        .from("memberships")
        .insert({
          tenant_id: invite.tenant_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
        })

      if (membershipError) throw membershipError
    }

    if (Array.isArray(invite.group_ids) && invite.group_ids.length) {
      for (const groupId of invite.group_ids) {
        const { data: existingGroupMember } = await admin
          .from("group_members")
          .select("id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle()

        if (!existingGroupMember) {
          const { error: groupMemberError } = await admin
            .from("group_members")
            .insert({
              group_id: groupId,
              user_id: user.id,
            })

          if (groupMemberError) throw groupMemberError
        }
      }
    }

    const moduleRows = DEFAULT_USER_MODULES.map((moduleKey) => ({
      tenant_id: invite.tenant_id,
      user_id: user.id,
      module_key: moduleKey,
    }))

    const { error: moduleError } = await admin
      .from("module_assignments")
      .upsert(moduleRows, {
        onConflict: "tenant_id,user_id,module_key",
      })

    if (moduleError) throw moduleError

    const { error: inviteUpdateError } = await admin
      .from("tenant_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        created_user_id: user.id,
      })
      .eq("id", invite.id)

    if (inviteUpdateError) throw inviteUpdateError

    return NextResponse.json({
      ok: true,
      tenant: {
        slug: invite.tenants.slug,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to finalize invite" },
      { status: 500 }
    )
  }
}
