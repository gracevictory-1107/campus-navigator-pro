import { describe, expect, it } from "vitest";
import { allFloorPlans } from "@/data/floorPlans";
import { calculateIndoorRoute } from "./indoorRouting";

function pointInside(point: { x: number; y: number }, room: { x: number; y: number; w: number; h: number }) {
  return point.x >= room.x && point.x <= room.x + room.w && point.y >= room.y && point.y <= room.y + room.h;
}

function segmentIntersectsRoom(
  a: { x: number; y: number },
  b: { x: number; y: number },
  room: { x: number; y: number; w: number; h: number }
) {
  if (pointInside(a, room) || pointInside(b, room)) return true;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let minimum = 0;
  let maximum = 1;
  for (const [p, q] of [[-dx, a.x - room.x], [dx, room.x + room.w - a.x], [-dy, a.y - room.y], [dy, room.y + room.h - a.y]] as [number, number][]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const ratio = q / p;
    if (p < 0) minimum = Math.max(minimum, ratio);
    else maximum = Math.min(maximum, ratio);
    if (minimum > maximum) return false;
  }
  return true;
}


describe("calculateIndoorRoute", () => {
  it("creates a measurable visual route between rooms on the same floor", () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "mb-gf", "library");

    expect(route).not.toBeNull();
    expect(route?.legs).toHaveLength(1);
    expect(route?.legs[0].floorId).toBe("mb-gf");
    expect(route?.legs[0].points.length).toBeGreaterThan(2);
    expect(route?.legs[0].startRoomId).toBe("principal");
    expect(route?.legs[0].endRoomId).toBe("library");
    expect(route?.distanceMeters).toBeGreaterThan(0);
    expect(route?.walkingMinutes).toBeGreaterThan(0);
  });

  it("uses mapped stair or lift rooms to connect different floors", () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "mb-f1", "comp1");

    expect(route).not.toBeNull();
    expect(route?.legs.map((leg) => leg.floorId)).toEqual(["mb-gf", "mb-f1"]);
    const sourceConnector = allFloorPlans["mb-gf"].rooms.find((room) => room.id === route?.legs[0].endRoomId);
    const destinationConnector = allFloorPlans["mb-f1"].rooms.find((room) => room.id === route?.legs[1].startRoomId);
    expect(["lift", "stairs"]).toContain(sourceConnector?.type);
    expect(destinationConnector?.type).toBe(sourceConnector?.type);
    expect(route?.transitions[0]).toContain("Use the");
  });

  it("uses existing entrances for different buildings and describes the unconnected gap", () => {
    const route = calculateIndoorRoute("mb-gf", "principal", "fb-gf", "museum-a");

    expect(route).not.toBeNull();
    expect(route?.legs).toHaveLength(2);
    expect(route?.legs[0].endKind).toBe("transition");
    expect(route?.legs[1].startKind).toBe("transition");
    expect(route?.transitions[0]).toContain("between-building segment is not drawn");
  });

  it("returns null for a room that is not in the selected floor plan", () => {
    expect(calculateIndoorRoute("mb-gf", "not-a-room", "mb-gf", "library")).toBeNull();
  });
});

  it("keeps single-corridor floor routes inside mapped walkable corridors", () => {
    for (const [floorId, plan] of Object.entries(allFloorPlans)) {
      const corridors = plan.rooms.filter((room) => room.type === "corridor");
      if (corridors.length !== 1) continue;

      const rooms = plan.rooms.filter((room) => room.type !== "corridor" && room.label);
      for (const from of rooms) {
        for (const to of rooms) {
          if (from.id === to.id) continue;
          const route = calculateIndoorRoute(floorId, from.id, floorId, to.id);
          expect(route).not.toBeNull();

          for (const leg of route!.legs) {
            for (const room of plan.rooms.filter((candidate) =>
              candidate.type !== "corridor" &&
              candidate.id !== leg.startRoomId &&
              candidate.id !== leg.endRoomId
            )) {
              for (let index = 1; index < leg.points.length; index += 1) {
                expect(segmentIntersectsRoom(leg.points[index - 1], leg.points[index], room)).toBe(false);
              }
            }
          }
        }
      }
    }
  });
\n