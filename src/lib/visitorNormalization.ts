/** Normalize optional database email values into a safe, canonical string. */
export function normalizeVisitorEmail(email: string | null | undefined): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}
