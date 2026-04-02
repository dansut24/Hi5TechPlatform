import { NextResponse } from "next/server"

const protectedPrefixes = [
  "/itsm",
  "/control",
  "/selfservice",
  "/admin",
  "/analytics",
  "/automation",
]

export function middleware(request) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!isProtected) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/itsm/:path*",
    "/control/:path*",
    "/selfservice/:path*",
    "/admin/:path*",
    "/analytics/:path*",
    "/automation/:path*",
  ],
}
