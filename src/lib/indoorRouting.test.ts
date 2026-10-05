import { describe, expect, it } from "vitest";
import { allFloorPlans } from "@/data/floorPlans";
import { calculateIndoorRoute } from "./indoorRouting";

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
