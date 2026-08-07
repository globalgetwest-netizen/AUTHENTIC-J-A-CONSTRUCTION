/**
 * Portal role buckets used by the Next.js route guards. These drive UI routing
 * only — the API remains the enforcement point (its AuthGuard + PermissionsGuard
 * reject calls a user lacks permissions for).
 */

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGEMENT"] as const;
export const STAFF_ROLES = ["STAFF", "EMPLOYEE"] as const;
export const CLIENT_ROLES = ["CLIENT"] as const;

export function isAdmin(roles: readonly string[]): boolean {
  return roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
}

export function isStaff(roles: readonly string[]): boolean {
  return roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
}

export function isClient(roles: readonly string[]): boolean {
  return roles.some((r) => (CLIENT_ROLES as readonly string[]).includes(r));
}