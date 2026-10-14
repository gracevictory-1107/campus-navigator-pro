import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { can, roles } from "./permissions";
import { SecurityProvider, useSecurity } from "./SecurityContext";
import { cameras } from "./data";
import type { LocationEvent, PersonType, Role } from "./types";

const getAuthenticatedRoleMock = vi.hoisted(() => vi.fn<() => Promise<Role | null>>());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
        window.setTimeout(() => listener("INITIAL_SESSION", { user: { id: "test-user" } }), 0);
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
      signOut: async () => ({ error: null }),
    },
  },
  supabaseConfigured: false,
  getAuthenticatedRole: (...args: Parameters<typeof getAuthenticatedRoleMock>) => getAuthenticatedRoleMock(...args),
  loadSecuritySnapshot: async () => null,
  persistSecuritySnapshot: async () => undefined,
}));

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

const securityWrapper = ({ children }: { children: ReactNode }) => createElement(SecurityProvider, null, children);

async function renderSignedInAs(role: Role | null) {
  getAuthenticatedRoleMock.mockResolvedValue(role);
  const utils = renderHook(() => useSecurity(), { wrapper: securityWrapper });
  await waitFor(() => expect(utils.result.current.signedIn).toBe(role !== null));
  return utils;
}

const visitorInput = {
  name: "Test Visitor",
  email: "visitor@example.com",
  mobile: "5550100",
  type: "General Visitor" as PersonType,
  visiting: "Registrar office",
  purpose: "Document collection",
  authorizedLocationId: cameras[0].locationId,
  expectedExit: "18:00",
};

describe("simulateDetection permission guard", () => {
  beforeEach(() => {
    getAuthenticatedRoleMock.mockReset();
  });

  it("allows an admin to register a visitor and simulate a camera detection", async () => {
    const { result } = await renderSignedInAs("admin");

    let visitorId = "";
    act(() => {
      visitorId = result.current.registerVisitor(visitorInput).id;
    });
    expect(visitorId).not.toBe("");

    let event: LocationEvent | null = null;
    await act(async () => {
      event = await result.current.simulateDetection(cameras[0].id, visitorId);
    });
    expect(event).not.toBeNull();
    expect(event?.personId).toBe(visitorId);
    expect(event?.cameraId).toBe(cameras[0].id);
    expect(event?.access).toBe("authorized");
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(result.current.alerts).toHaveLength(0);
  });

  it("passes management through the guard (CCTV management role) and returns null without a matching visitor", async () => {
    const { result } = await renderSignedInAs("management");
    await expect(result.current.simulateDetection(cameras[0].id, "VIS-NONE")).resolves.toBeNull();
    expect(result.current.events).toHaveLength(0);
  });

  it.each(["pending", "student", "faculty", "staff", "security"] as const)(
    "rejects %s with a permission error before touching security state",
    async (role) => {
      const { result } = await renderSignedInAs(role === "pending" ? null : role);
      await expect(result.current.simulateDetection(cameras[0].id, "VIS-NONE")).rejects.toThrow(
        "You do not have permission to simulate camera detections."
      );
      expect(result.current.events).toHaveLength(0);
      expect(result.current.alerts).toHaveLength(0);
    }
  );
});
