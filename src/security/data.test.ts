import { describe, expect, it } from "vitest";
import { admissionsOnlyRuleId, defaultRules, securityLocations } from "./data";
import { personTypes } from "./types";

describe("default visitor access rules", () => {
  it("creates exactly one rule for every visitor category and mapped security location", () => {
    expect(defaultRules).toHaveLength(personTypes.length * securityLocations.length);
    expect(new Set(defaultRules.map((rule) => rule.id)).size).toBe(defaultRules.length);
  });

  it("preserves the existing camera and visit location IDs", () => {
    for (const id of ["main-gate", "reception", "principal-office", "cash-counter", "canteen", "meeting-room", "library", "placement-cell", "cse-lab", "staff-room"]) {
      expect(securityLocations.some((location) => location.id === id)).toBe(true);
    }
  });

  it("marks the Parent Library permission as admissions-only and disabled by default", () => {
    const library = securityLocations.find((location) => location.id === "library");
    expect(library?.admissionsOnly).toBe(true);
    expect(defaultRules.find((rule) => rule.id === admissionsOnlyRuleId)?.allowed).toBe(false);
  });

  it("marks corridors and staircases as pass-through paths", () => {
    expect(securityLocations.some((location) => location.id === "ground-floor-corridor" && location.isPublicPath)).toBe(true);
    expect(securityLocations.some((location) => location.name.startsWith("Stairs") && location.isPublicPath)).toBe(true);
  });
});
