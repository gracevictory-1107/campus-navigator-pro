import { describe, expect, it } from "vitest";
import { getRoleLandingPath } from "./roleLanding";

describe("getRoleLandingPath", () => {
  it("opens the Security dashboard for Security accounts", () => {
    expect(getRoleLandingPath("security")).toBe("/security");
  });

  it("keeps pending accounts on the approval status page", () => {
    expect(getRoleLandingPath("pending")).toBe("/auth/callback");
  });

  it.each(["student", "faculty", "staff", "management", "admin"] as const)(
    "opens the Campus Map for %s accounts",
    (role) => {
      expect(getRoleLandingPath(role)).toBe("/campus");
    },
  );
});
