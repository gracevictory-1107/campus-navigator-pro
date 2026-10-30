import { describe, expect, it } from "vitest";
import { calculateIndoorRoute } from "@/lib/indoorRouting";
import { accessService } from "./services";
import { admissionsOnlyRuleId, defaultRules, securityLocations, seedVisitors } from "./data";
import { evaluateIndoorRouteAccess } from "./routeAccess";
import { personTypes, type PersonType, type Visitor } from "./types";

const visitor = (type: PersonType, overrides: Partial<Visitor> = {}): Visitor => ({
  ...seedVisitors[0],
  type,
  authorizedLocationId: "reception",
  ...overrides,
});

const decide = async (type: PersonType, from: [string, string], to: [string, string], rules = defaultRules, overrides: Partial<Visitor> = {}) => {
  const route = calculateIndoorRoute(from[0], from[1], to[0], to[1]);
  expect(route).not.toBeNull();
  return evaluateIndoorRouteAccess(visitor(type, overrides), rules, route!);
};

describe("campus visitor access policy", () => {
  it("allows Recruiters to reach offices, seminar halls, AIC, canteen, library and dining room", async () => {
    for (const [floorId, roomId] of [
      ["mb-gf", "principal"],
      ["mb-gf", "director"],
      ["mb-gf", "admin-desk"],
      ["mb-gf", "vp-cabin"],
      ["mb-f5", "mini-seminar"],
      ["sheds", "seminar-hall"],
      ["fb-f2", "innov"],
      ["mb-gf", "canteen"],
      ["mb-gf", "library"],
      ["sheds", "shed4-dining"],
    ] as const) {
      const location = securityLocations.find((item) => item.floorId === floorId && item.roomId === roomId);
      expect(location, `missing mapped location for ${floorId}:${roomId}`).toBeDefined();
      const rule = defaultRules.find((item) => item.id === `Recruiter:${location!.id}`);
      expect(rule?.allowed, `Recruiter should be allowed at ${location!.name}`).toBe(true);
    }
  });

  it("allows general, business and motivational visitors to offices, canteen, ground corridor and seminar halls", () => {
    const allowedRoomIds = [
      "principal", "director", "admin-desk", "vp-cabin", "help-desk", "office-desk",
      "canteen", "free-space-1", "mini-seminar", "seminar-hall",
    ];
    const types: PersonType[] = ["General Visitor", "Product/Business Visitor", "Inspirational/Motivational Visitor"];
    for (const type of types) {
      for (const roomId of allowedRoomIds) {
        const location = securityLocations.find((item) => item.roomId === roomId);
        expect(location, `missing mapped location for ${roomId}`).toBeDefined();
        expect(defaultRules.find((item) => item.id === `${type}:${location!.id}`)?.allowed).toBe(true);
      }
    }
  });

  it("keeps Parent access to offices, ground-floor corridor and canteen, with Library off by default", () => {
    const parentAllowed = [
      "principal-office", "placement-cell", "administrative-office", "vice-principal-office",
      "reception", "office-desk", "cash-counter", "ground-floor-corridor", "canteen", "main-gate",
    ];
    for (const locationId of parentAllowed) {
      expect(defaultRules.find((item) => item.id === `Parent:${locationId}`)?.allowed, locationId).toBe(true);
    }
    expect(admissionsOnlyRuleId).toBe("Parent:library");
    expect(defaultRules.find((item) => item.id === admissionsOnlyRuleId)?.allowed).toBe(false);
  });

  it("grants the Faculty/Staff visitor category full access to every mapped area", () => {
    for (const location of securityLocations) {
      expect(defaultRules.find((rule) => rule.id === `Faculty/Staff:${location.id}`)?.allowed, location.name).toBe(true);
    }
  });

  it("allows Parents and standard visitors to reach the mapped ground-floor corridor", async () => {
    const corridor = securityLocations.find((location) =>
      location.floorId === "mb-gf" && location.roomId === "free-space-1"
    );
    expect(corridor?.id).toBe("ground-floor-corridor");

    for (const type of ["Parent", "General Visitor", "Product/Business Visitor", "Inspirational/Motivational Visitor"] as const) {
      const decision = await decide(type, ["mb-gf", "main-entrance"], ["mb-gf", "free-space-1"]);
      expect(decision.allowed, `${type} should be allowed in the ground-floor corridor`).toBe(true);
    }
  });

  it("allows Parent Library access only when the admissions rule is enabled", async () => {
    const denied = await decide("Parent", ["mb-gf", "main-entrance"], ["mb-gf", "library"]);
    expect(denied.allowed).toBe(false);
    expect(denied.deniedAreas.some((area) => area.roomId === "library")).toBe(true);

    const admissionsRules = defaultRules.map((rule) =>
      rule.id === admissionsOnlyRuleId ? { ...rule, allowed: true } : rule
    );
    const allowed = await decide("Parent", ["mb-gf", "main-entrance"], ["mb-gf", "library"], admissionsRules);
    expect(allowed.allowed).toBe(true);
  });

  it("does not let an assigned visit destination override an explicit category restriction", async () => {
    const decision = await decide(
      "Parent",
      ["mb-gf", "main-entrance"],
      ["mb-gf", "board-room"],
      defaultRules,
      { authorizedLocationId: "meeting-room" },
    );
    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas.some((area) => area.roomId === "board-room")).toBe(true);
  });

  it("blocks Parents from classrooms, seminar halls, Board Room and Innovation Center", async () => {
    const restrictedTargets: [string, string][] = [
      ["mb-f3", "classroom-a"],
      ["fb-f1", "room4"],
      ["fb-f1", "room2"],
      ["mb-gf", "board-room"],
      ["mb-f5", "mini-seminar"],
      ["sheds", "seminar-hall"],
      ["fb-f2", "innov"],
    ];
    for (const [floorId, roomId] of restrictedTargets) {
      const decision = await decide("Parent", ["mb-gf", "main-entrance"], [floorId, roomId]);
      expect(decision.allowed, `Parent must not access ${floorId}:${roomId}`).toBe(false);
    }
  });

  it("blocks Board Room, classrooms and Innovation Center for standard visitors", async () => {
    for (const type of ["General Visitor", "Product/Business Visitor", "Inspirational/Motivational Visitor"] as const) {
      for (const [floorId, roomId] of [["mb-gf", "board-room"], ["mb-f3", "classroom-a"], ["fb-f2", "innov"]] as const) {
        const decision = await decide(type, ["mb-gf", "main-entrance"], [floorId, roomId]);
        expect(decision.allowed, `${type} must not access ${floorId}:${roomId}`).toBe(false);
      }
    }
  });

  it("allows seminar halls and Innovation Center for Recruiters, but not the Board Room", async () => {
    expect((await decide("Recruiter", ["mb-gf", "main-entrance"], ["mb-f5", "mini-seminar"])).allowed).toBe(true);
    expect((await decide("Recruiter", ["mb-gf", "main-entrance"], ["sheds", "seminar-hall"])).allowed).toBe(true);
    expect((await decide("Recruiter", ["mb-gf", "main-entrance"], ["fb-f2", "innov"])).allowed).toBe(true);
    expect((await decide("Recruiter", ["mb-gf", "main-entrance"], ["mb-gf", "board-room"])).allowed).toBe(false);
  });

  it("allows all visitor categories to use every mapped staircase", async () => {
    const staircases = securityLocations.filter((location) => location.id.startsWith("path:") && location.name.startsWith("Stairs"));
    expect(staircases.length).toBeGreaterThan(0);
    for (const type of personTypes) {
      for (const staircase of staircases) {
        await expect(accessService.check(visitor(type), staircase.id, defaultRules)).resolves.toBe("authorized");
      }
    }
  });

  it("does not grant visitors unrestricted lift access", () => {
    const lifts = securityLocations.filter((location) => location.id.startsWith("path:") && location.name.startsWith("Lift"));
    expect(lifts.length).toBeGreaterThan(0);
    for (const type of personTypes.filter((candidate) => candidate !== "Faculty/Staff")) {
      for (const lift of lifts) {
        expect(defaultRules.find((rule) => rule.id === `${type}:${lift.id}`)?.allowed).toBe(false);
      }
    }
    for (const lift of lifts) {
      expect(defaultRules.find((rule) => rule.id === `Faculty/Staff:${lift.id}`)?.allowed).toBe(true);
    }
  });

  it("blocks a visitor route that starts inside an unapproved classroom", async () => {
    const decision = await decide("Parent", ["mb-f3", "classroom-a"], ["mb-gf", "principal"]);
    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas.some((area) => area.roomId === "classroom-a")).toBe(true);
  });

  it("does not treat an unconfigured room as accessible", async () => {
    const decision = await decide("General Visitor", ["mb-gf", "principal"], ["mb-f3", "classroom-a"]);
    expect(decision.allowed).toBe(false);
    expect(decision.deniedAreas[0]).toMatchObject({ roomId: "classroom-a", label: "Classroom A" });
  });

  it("keeps corridor and staircase permissions from blocking routes that only pass through them", async () => {
    const decision = await decide("Recruiter", ["mb-gf", "principal"], ["mb-gf", "canteen"]);
    expect(decision.allowed).toBe(true);
  });
});
