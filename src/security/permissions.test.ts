import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { can, roles } from "./permissions";
import { SecurityProvider, useSecurity } from "./SecurityContext";
import { cameras } from "./data";
import { calculateIndoorRoute } from "@/lib/indoorRouting";
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

describe("separate campus employee roles", () => {
  it("keeps Faculty and Staff as distinct assignable account roles", () => {
    expect(roles).toContainEqual({ id: "faculty", label: "Faculty" });
    expect(roles).toContainEqual({ id: "staff", label: "Staff" });
    expect(roles.findIndex((role) => role.id === "faculty")).not.toBe(roles.findIndex((role) => role.id === "staff"));
  });
});

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

  it("creates a High active alert and highlights the camera for a restricted Parent detection", async () => {
    const { result } = await renderSignedInAs("admin");
    const restrictedCamera = cameras.find((camera) => camera.locationId === "cse-lab");
    expect(restrictedCamera).toBeDefined();

    let visitorId = "";
    act(() => {
      visitorId = result.current.registerVisitor({
        ...visitorInput,
        name: "SIMULATION ONLY - Parent",
        email: "sim-parent@example.invalid",
        type: "Parent",
        authorizedLocationId: "cse-lab",
      }).id;
    });

    let event: LocationEvent | null = null;
    await act(async () => {
      event = await result.current.simulateDetection(restrictedCamera!.id, visitorId);
    });

    expect(event).toMatchObject({
      personId: visitorId,
      cameraId: restrictedCamera!.id,
      locationId: "cse-lab",
      access: "restricted",
    });
    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
      expect(result.current.alerts).toHaveLength(1);
    });
    expect(result.current.alerts[0]).toMatchObject({
      event: { id: event!.id, access: "restricted" },
      severity: "High",
      status: "Active",
      history: [{ status: "Active", by: "security" }],
    });
    expect(result.current.highlightedCameraId).toBe(restrictedCamera!.id);
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


describe("full campus account access", () => {
  it.each(["student", "faculty", "staff"] as const)(
    "%s can route anywhere on campus without visitor-category restrictions",
    async (role) => {
      const { result } = await renderSignedInAs(role);
      const route = calculateIndoorRoute("mb-gf", "main-entrance", "fb-f2", "innov");
      expect(route).not.toBeNull();

      await expect(result.current.authorizeIndoorRoute(null, route!)).resolves.toMatchObject({
        allowed: true,
        deniedAreas: [],
      });
    },
  );
});
