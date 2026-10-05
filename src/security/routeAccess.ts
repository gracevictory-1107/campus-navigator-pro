import type { IndoorRoute, RouteLeg, RoutePoint } from "@/lib/indoorRouting";
import { allFloorPlans } from "@/data/floorPlans";
import { securityLocations } from "./data";
import { accessService } from "./services";
import type { AccessRule, SecurityLocation, Visitor } from "./types";

export interface RestrictedRouteArea {
  floorId: string;
  roomId: string;
  label: string;
  locationId: string;
}

export interface RouteAccessDecision {
  allowed: boolean;
  deniedAreas: RestrictedRouteArea[];
  permittedAlternatives: SecurityLocation[];
}

function pointInsideRoom(point: RoutePoint, room: { x: number; y: number; w: number; h: number }) {
  return point.x >= room.x && point.x <= room.x + room.w && point.y >= room.y && point.y <= room.y + room.h;
}

function segmentIntersectsRoom(a: RoutePoint, b: RoutePoint, room: { x: number; y: number; w: number; h: number }) {
  if (pointInsideRoom(a, room) || pointInsideRoom(b, room)) return true;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let minimum = 0;
  let maximum = 1;
  const edges: [number, number][] = [
    [-dx, a.x - room.x],
    [dx, room.x + room.w - a.x],
    [-dy, a.y - room.y],
    [dy, room.y + room.h - a.y],
  ];

  for (const [p, q] of edges) {
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

function legIntersectsRoom(leg: RouteLeg, roomId: string) {
  const room = allFloorPlans[leg.floorId]?.rooms.find((candidate) => candidate.id === roomId);
  if (!room) return false;
  return leg.points.slice(1).some((point, index) => segmentIntersectsRoom(leg.points[index], point, room));
}

function uniqueRouteLocations(route: IndoorRoute): SecurityLocation[] {
  const target = securityLocations.find((location) =>
    location.floorId === route.toFloorId && location.roomId === route.toRoomId
  );
  const encountered = securityLocations.filter((location) =>
    route.legs.some((leg) => leg.floorId === location.floorId && legIntersectsRoom(leg, location.roomId))
  );
  const ordered = target ? [target, ...encountered] : encountered;
  return ordered.filter((location, index) => ordered.findIndex((candidate) => candidate.id === location.id) === index);
}

export async function evaluateIndoorRouteAccess(
  visitor: Visitor,
  rules: AccessRule[],
  route: IndoorRoute
): Promise<RouteAccessDecision> {
  const locations = uniqueRouteLocations(route);
  const targetMapped = locations.some((location) =>
    location.floorId === route.toFloorId && location.roomId === route.toRoomId
  );
  const targetRoom = allFloorPlans[route.toFloorId]?.rooms.find((room) => room.id === route.toRoomId);
  if (!targetRoom) throw new Error(`Route destination ${route.toFloorId}:${route.toRoomId} does not exist.`);

  const checks = await Promise.all(locations.map(async (location) => ({
    location: {
      floorId: location.floorId,
      roomId: location.roomId,
      label: location.name,
      locationId: location.id,
    },
    access: await accessService.check(visitor, location.id, rules),
  })));

  if (!targetMapped) {
    checks.unshift({
      location: {
        floorId: route.toFloorId,
        roomId: route.toRoomId,
        label: targetRoom.label,
        locationId: targetRoom.id,
      },
      access: "restricted",
    });
  }

  const deniedAreas = checks.filter((check) => check.access === "restricted").map((check) => check.location);
  const permittedAlternatives = (await Promise.all(
    securityLocations
      .filter((location) => location.floorId !== route.toFloorId || location.roomId !== route.toRoomId)
      .map(async (location) => ({
        location,
        access: await accessService.check(visitor, location.id, rules),
      }))
  )).filter((result) => result.access === "authorized").map((result) => result.location);

  return { allowed: deniedAreas.length === 0, deniedAreas, permittedAlternatives };
}
