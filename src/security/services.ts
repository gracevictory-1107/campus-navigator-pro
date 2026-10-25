import type { AccessRule, AccessStatus, Visitor } from "./types";

/**
 * Evaluates the configured campus visitor-access rules for a location.
 * This policy check is independent of any camera hardware or video stream.
 */
export interface AccessService {
  check(visitor: Visitor, locationId: string, rules: AccessRule[]): Promise<AccessStatus>;
}

export const accessService: AccessService = {
  async check(visitor, locationId, rules) {
    if (visitor.status === "Blocked") return "restricted";
    if (visitor.authorizedLocationId === locationId) return "authorized";
    const rule = rules.find((candidate) => candidate.personType === visitor.type && candidate.locationId === locationId);
    return rule?.allowed ? "authorized" : "restricted";
  },
};

/**
 * Finds a possible existing visitor record using the details supplied at registration.
 * A record lookup is not identity verification; face-template matching and a physical
 * identity check remain separate steps in the visitor workflow.
 */
export function findExistingVisitorByDetails(
  input: { name: string; mobile: string },
  knownVisitors: Visitor[],
): Visitor | undefined {
  const name = input.name.trim().toLocaleLowerCase();
  const mobile = input.mobile.replace(/\D/g, "");
  if (!name || !mobile) return undefined;

  return knownVisitors.find((visitor) =>
    visitor.mobile.replace(/\D/g, "") === mobile &&
    visitor.name.trim().toLocaleLowerCase() === name
  );
}
