import type { Visitor } from "./types";

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
