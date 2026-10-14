import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "daamkoto_admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    // Require ADMIN_SECRET to be set: otherwise a missing cookie (undefined)
    // would equal the missing secret (undefined) and let anyone in.
    const secret = process.env.ADMIN_SECRET;
    if (!secret || cookie !== secret) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
