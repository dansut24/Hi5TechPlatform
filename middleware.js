import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function isPublicRoute(pathname) {
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/redirect") ||
    pathname.startsWith("/trial") ||
    pathname.startsWith("/setup")
  ) {
    return true
  }

  if (/^\/tenant\/[^/]+\/login(?:\/.*)?$/.test(pathname)) {
    return true
  }

  if (/^\/tenant\/[^/]+\/set-password(?:\/.*)?$/.test(pathname)) {
    return true
  }

  return false
}

function getTenantLoginPath(pathname) {
  const match = pathname.match(/^\/tenant\/([^/]+)/)
  if (!match) return null
  return `/tenant/${match[1]}/login`
}

const protectedPrefixes = [
  "/itsm",
  "/control",
  "/selfservice",
  "/admin",
  "/analytics",
  "/automation",
  "/select-module",
  "/select-tenant",
  "/create-workspace",
  "/tenant",
]

export async function middleware(request) {
  const { pathname, search } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!isProtected) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const tenantLoginPath = getTenantLoginPath(pathname)
    const redirectPath = `${pathname}${search || ""}`

    const loginUrl = new URL(
      tenantLoginPath || "/login",
      request.url
    )

    loginUrl.searchParams.set("next", redirectPath)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/redirect/:path*",
    "/trial/:path*",
    "/setup/:path*",
    "/itsm/:path*",
    "/control/:path*",
    "/selfservice/:path*",
    "/admin/:path*",
    "/analytics/:path*",
    "/automation/:path*",
    "/select-module/:path*",
    "/select-tenant/:path*",
    "/create-workspace/:path*",
    "/tenant/:path*",
  ],
}
