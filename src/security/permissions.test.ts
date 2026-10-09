import { describe, expect, it } from "vitest";
import { can, roles } from "./permissions";

describe("pending campus accounts", () => {
  it("shows an explicit pending-approval role", () => {
    expect(roles).toContainEqual({ id: "pending", label: "Pending approval" });
  });

  it("does not grant campus security, visitor, CCTV, management, or admin permissions", () => {
    const permissions = [
      can.viewSecurity,
      can.manageSecurity,
      can.manageAccessControl,
      can.manageVisitors,
      can.viewCCTV,
      can.manageCCTV,
      can.viewManagement,
      can.administer,
    ];

    for (const hasPermission of permissions) {
      expect(hasPermission("pending")).toBe(false);
    }
  });
});
