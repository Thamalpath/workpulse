/**
 * Enterprise Authentication & Session Configuration
 *
 * Security Architecture: Zero-Trust / Default-Deny
 * All application routes are protected by default. Only explicitly
 * matching public routes (e.g. /login, /register) are accessible without an active session.
 */

export const AUTH_CONFIG = {
  cookieName: "workpulse_token",
  routes: {
    login: "/login",
    register: "/register",
    defaultAuthenticatedRedirect: "/dashboard",
  },
} as const;

/**
 * Public routes allowed for unauthenticated visitors.
 * Standard RegExp patterns ensure precise matching (including sub-paths if any).
 */
const PUBLIC_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/login(?:\/.*)?$/,
  /^\/register(?:\/.*)?$/,
] as const;

/**
 * Determines whether a given pathname is an explicitly public route.
 * Any route returning false is treated as private/protected by default.
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}
