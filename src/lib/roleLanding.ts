import type { Role } from "@/security/types";

/**
 * Send each campus role to the area intended for its permissions.
 * Pending accounts must complete approval before opening campus features.
 */
export function getRoleLandingPath(role: Role): string {
  if (role === "security") return "/security";
  if (role === "pending") return "/auth/callback";
  return "/campus";
}
