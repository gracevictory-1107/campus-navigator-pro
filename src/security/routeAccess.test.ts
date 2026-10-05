import { describe, expect, it } from "vitest";
import { calculateIndoorRoute } from "@/lib/indoorRouting";
import { defaultRules, seedVisitors } from "./data";
import { evaluateIndoorRouteAccess } from "./routeAccess";
import type { Visitor } from "./types";

const visitor = (overrides: Partial<Visitor>): Visitor => ({
  ...seedVisitors[0],
  ...overrides,
});

describe("evaluateIndoorRouteAccess", () => {
  it("allows a recruiter to reach their explicitly authorized placement cell", async () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "mb-gf", "director");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(
      visitor({ authorizedLocationId: "placement-cell" }),
      defaultRules,
      route!
    );

    expect(decision.allowed).toBe(true);
    expect(decision.deniedAreas).toEqual([]);
  });

  it("denies a recruiter access to the library and offers permitted alternatives", async () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "mb-gf", "library");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(seedVisitors[0], defaultRules, route!);

    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas[0]).toMatchObject({ roomId: "library", label: "Library" });
    expect(decision.permittedAlternatives.some((location) => location.id === "placement-cell")).toBe(true);
  });

  it("allows a parent category to reach the library under the existing access rules", async () => {
    const route = calculateIndoorRoute("mb-gf", "board-room", "mb-gf", "library");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(
      visitor({ type: "Parent", authorizedLocationId: undefined }),
      defaultRules,
      route!
    );

    expect(decision.allowed).toBe(true);
    expect(decision.deniedAreas).toEqual([]);
  });

  it("denies a route crossing a restricted staff room even when its destination is allowed", async () => {
    const route = calculateIndoorRoute("mb-f1", "mens-staff", "mb-f1", "comp1");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(
      visitor({ authorizedLocationId: "cse-lab" }),
      defaultRules,
      route!
    );

    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas.some((area) => area.roomId === "mens-staff")).toBe(true);
  });

  it("allows a visitor explicitly authorized for a restricted mapped destination across floors", async () => {
    const route = calculateIndoorRoute("mb-gf", "lift", "mb-f1", "comp1");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(
      visitor({ authorizedLocationId: "cse-lab" }),
      defaultRules,
      route!
    );

    expect(route?.legs).toHaveLength(2);
    expect(decision.allowed).toBe(true);
  });

  it("denies unconfigured destinations instead of treating missing rules as permission", async () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "mb-gf", "canteen");
    expect(route).not.toBeNull();
    const decision = await evaluateIndoorRouteAccess(seedVisitors[0], defaultRules, route!);

    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas[0]).toMatchObject({ roomId: "canteen", label: "Canteen" });
  });
});
