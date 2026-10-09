import { describe, expect, it } from "vitest";
import { allFloorPlans } from "@/data/floorPlans";
import { calculateIndoorRoute } from "./indoorRouting";

function isFinitePoint(point: { x: number; y: number }) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

describe("full campus pin-to-pin route coverage", () => {
  it("produces a valid result for every labeled room pair on every floor", () => {
    let checkedPairs = 0;

    for (const [floorId, plan] of Object.entries(allFloorPlans)) {
      const rooms = plan.rooms.filter((room) => room.label.trim().length > 0);
      for (const from of rooms) {
        for (const to of rooms) {
          if (from.id === to.id) continue;
          checkedPairs += 1;

          const route = calculateIndoorRoute(floorId, from.id, floorId, to.id);
          expect(route, `Missing route on ${floorId}: ${from.id} -> ${to.id}`).not.toBeNull();
          expect(route!.legs.length).toBe(1);
          expect(route!.legs[0].startRoomId).toBe(from.id);
          expect(route!.legs[0].endRoomId).toBe(to.id);
          expect(route!.legs[0].points.length).toBeGreaterThan(0);
          expect(route!.legs[0].points.every(isFinitePoint)).toBe(true);
          expect(Number.isFinite(route!.distanceMeters)).toBe(true);
          expect(route!.distanceMeters).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(route!.walkingMinutes)).toBe(true);
        }
      }
    }

    expect(checkedPairs).toBeGreaterThan(1000);
  });

  it("connects representative pins across every distinct pair of floors", () => {
    const floors = Object.entries(allFloorPlans);
    let checkedPairs = 0;

    for (const [fromFloorId, fromPlan] of floors) {
      const from = fromPlan.rooms.find((room) => room.label.trim().length > 0);
      if (!from) continue;

      for (const [toFloorId, toPlan] of floors) {
        if (fromFloorId === toFloorId) continue;
        const to = toPlan.rooms.find((room) => room.label.trim().length > 0);
        if (!to) continue;
        checkedPairs += 1;

        const route = calculateIndoorRoute(fromFloorId, from.id, toFloorId, to.id);
        expect(route, `Missing cross-floor route: ${fromFloorId}/${from.id} -> ${toFloorId}/${to.id}`).not.toBeNull();
        expect(route!.legs.length).toBeGreaterThanOrEqual(2);
        expect(route!.legs[0].startRoomId).toBe(from.id);
        expect(route!.legs[route!.legs.length - 1].endRoomId).toBe(to.id);
        expect(route!.legs.every((leg) => leg.points.every(isFinitePoint))).toBe(true);
      }
    }

    expect(checkedPairs).toBeGreaterThan(100);
  });
});
