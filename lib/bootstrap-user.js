import { createSupabaseServerClient } from "@/lib/supabase/server"

const DEFAULT_MODULES = [
  "itsm",
  "control",
  "selfservice",
  "admin",
  "analytics",
  "automation",
]

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function initialsFromName(name, email) {
  const source = name?.trim() || email?.trim() || "User"
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U"
}

export async function bootstrapSignedInUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return null

  const email = user.email || null
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email?.split("@")[0] ||
    "User"

  const initials = initialsFromName(fullName, email)

  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        email,
        initials,
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  let { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    const baseSlug = slugify(fullName || email || "workspace")
    const tenantSlug = `${baseSlug || "workspace"}-${user.id.slice(0, 8)}`

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: `${fullName}'s Workspace`,
        slug: tenantSlug,
        status: "active",
      })
      .select("id")
      .single()

    if (tenantError) throw tenantError

    const { error: membershipError } = await supabase.from("memberships").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: "owner",
    })

    if (membershipError) throw membershipError

    const moduleRows = DEFAULT_MODULES.map((moduleKey) => ({
      tenant_id: tenant.id,
      user_id: user.id,
      module_key: moduleKey,
    }))

    await supabase.from("module_assignments").upsert(moduleRows, {
      onConflict: "tenant_id,user_id,module_key",
    })

    membership = { tenant_id: tenant.id, role: "owner" }
  }

  return {
    user,
    tenantId: membership.tenant_id,
    role: membership.role,
  }
}
