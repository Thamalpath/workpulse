import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_CONFIG, isPublicRoute } from "@/config/auth";

/**
 * Validates JWT token structure and expiration claim without requiring Node crypto.
 * Compatible with Next.js Edge Runtime.
 */
function isSessionTokenValid(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode base64url payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload) as { exp?: number; sub?: string };

    // Valid token must contain a subject claim
    if (!payload.sub) return false;

    // Check expiration with a 5-second skew tolerance
    if (typeof payload.exp === "number") {
      return payload.exp * 1000 > Date.now() - 5000;
    }

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get(AUTH_CONFIG.cookieName);
  const token = tokenCookie?.value;
  const isAuthenticated = isSessionTokenValid(token);

  // 1. Root route ("/")
  if (pathname === "/") {
    const target = isAuthenticated
      ? AUTH_CONFIG.routes.defaultAuthenticatedRedirect
      : AUTH_CONFIG.routes.login;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isPublic = isPublicRoute(pathname);

  // 2. Authenticated user attempting to visit a public auth page (e.g. /login, /register)
  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(
      new URL(AUTH_CONFIG.routes.defaultAuthenticatedRedirect, request.url),
    );
  }

  // 3. Unauthenticated user accessing ANY private route (Zero-Trust: Default-Deny)
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL(AUTH_CONFIG.routes.login, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);

    // Evict any stale or expired cookie from the client
    if (tokenCookie) {
      response.cookies.delete(AUTH_CONFIG.cookieName);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (proxied to backend)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - metadata: favicon.ico, sitemap.xml, robots.txt
     * - static file extensions (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
