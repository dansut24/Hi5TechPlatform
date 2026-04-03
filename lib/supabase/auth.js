import { getSupabaseClient } from "@/lib/supabase/client"

function requireSupabase() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase environment variables are missing")
  }

  return supabase
}

export async function signInWithPassword({ email, password }) {
  const supabase = requireSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signUpWithPassword({ email, password }) {
  const supabase = requireSupabase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getCurrentUser() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function signInWithGoogle() {
  const supabase = requireSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/select-module`
          : undefined,
    },
  })

  if (error) throw error
  return data
}

export async function signInWithMicrosoft() {
  const supabase = requireSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/select-module`
          : undefined,
    },
  })

  if (error) throw error
  return data
}

export async function signInWithGitHub() {
  const supabase = requireSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/select-module`
          : undefined,
    },
  })

  if (error) throw error
  return data
}
