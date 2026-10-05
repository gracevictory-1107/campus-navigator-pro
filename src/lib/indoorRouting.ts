import { allFloorPlans, type FloorPlan, type Room } from "@/data/floorPlans";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RouteLeg {
  floorId: string;
  points: RoutePoint[];
  startRoomId: string;
  endRoomId: string;
  startLabel: string;
  endLabel: string;
  startKind: "start" | "transition";
  endKind: "destination" | "transition";
  distanceMeters: number;
}

export interface IndoorRoute {
  fromFloorId: string;
  fromRoomId: string;
  fromLabel: string;
  toFloorId: string;
  toRoomId: string;
  toLabel: string;
  legs: RouteLeg[];
  transitions: string[];
  distanceMeters: number;
  walkingMinutes: number;
  isApproximate: true;
}

const METERS_PER_MAP_UNIT = 0.05;
const WALKING_METERS_PER_MINUTE = 80;

function center(room: Room): RoutePoint {
  return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
}

function distance(a: RoutePoint, b: RoutePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function appendPoint(points: RoutePoint[], point: RoutePoint) {
  const last = points[points.length - 1];
  if (!last || distance(last, point) > 0.01) points.push(point);
}

function corridorBoundaryPoint(corridor: Room, toward: RoutePoint): RoutePoint {
  const c = center(corridor);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (Math.abs(dx / Math.max(corridor.w, 1)) > Math.abs(dy / Math.max(corridor.h, 1))) {
    return { x: dx < 0 ? corridor.x : corridor.x + corridor.w, y: c.y };
  }
  return { x: c.x, y: dy < 0 ? corridor.y : corridor.y + corridor.h };
}

function routeSegment(plan: FloorPlan, from: Room, to: Room): RoutePoint[] {
  const start = center(from);
  const end = center(to);
  const corridors = plan.rooms.filter((room) => room.type === "corridor");

  if (corridors.length === 0) return [start, end];

  const nearestCorridor = (point: RoutePoint) =>
    corridors.reduce((nearest, corridor) =>
      distance(point, center(corridor)) < distance(point, center(nearest)) ? corridor : nearest
    );

  const startCorridor = nearestCorridor(start);
  const endCorridor = nearestCorridor(end);
  const startBoundary = corridorBoundaryPoint(startCorridor, start);
  const endBoundary = corridorBoundaryPoint(endCorridor, end);
  const points: RoutePoint[] = [start];

  appendPoint(points, startBoundary);
  if (startCorridor.id === endCorridor.id) {
    const c = center(startCorridor);
    if (startCorridor.w >= startCorridor.h) {
      appendPoint(points, { x: c.x, y: startBoundary.y });
      appendPoint(points, { x: c.x, y: endBoundary.y });
    } else {
      appendPoint(points, { x: startBoundary.x, y: c.y });
      appendPoint(points, { x: endBoundary.x, y: c.y });
    }
  } else {
    appendPoint(points, center(startCorridor));
    appendPoint(points, center(endCorridor));
  }
  appendPoint(points, endBoundary);
  appendPoint(points, end);
  return points;
}

function routeLeg(
  floorId: string,
  from: Room,
  to: Room,
  startKind: RouteLeg["startKind"],
  endKind: RouteLeg["endKind"]
): RouteLeg {
  const plan = allFloorPlans[floorId];
  const points = routeSegment(plan, from, to);
  const mapUnits = points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
  return {
    floorId,
    points,
    startRoomId: from.id,
    endRoomId: to.id,
    startLabel: from.label,
    endLabel: to.label,
    startKind,
    endKind,
    distanceMeters: mapUnits * METERS_PER_MAP_UNIT,
  };
}

function nearestRoom(rooms: Room[], point: RoutePoint): Room | undefined {
  return rooms.reduce<Room | undefined>((nearest, room) =>
    !nearest || distance(center(room), point) < distance(center(nearest), point) ? room : nearest
  , undefined);
}

function findRoom(plan: FloorPlan, roomId: string): Room | undefined {
  return plan.rooms.find((room) => room.id === roomId);
}

function buildingForFloor(floorId: string): string {
  if (floorId.startsWith("mb-")) return "Main Building";
  if (floorId.startsWith("fb-")) return "Fisheries Block";
  if (floorId.startsWith("bb-")) return "B Block";
  if (floorId === "sheds") return "Campus Sheds";
  return "Campus";
}

function connectorCandidates(plan: FloorPlan): Room[] {
  return plan.rooms.filter((room) => room.type === "stairs" || room.type === "lift");
}

function chooseConnectorPair(fromPlan: FloorPlan, toPlan: FloorPlan, from: Room, to: Room) {
  const fromConnectors = connectorCandidates(fromPlan);
  const toConnectors = connectorCandidates(toPlan);
  let best: { from: Room; to: Room; score: number } | undefined;

  for (const fromConnector of fromConnectors) {
    for (const toConnector of toConnectors) {
      if (fromConnector.type !== toConnector.type) continue;
      const sameIdPenalty = fromConnector.id === toConnector.id ? 0 : 150;
      const score =
        distance(center(from), center(fromConnector)) +
        distance(center(to), center(toConnector)) +
        sameIdPenalty;
      if (!best || score < best.score) best = { from: fromConnector, to: toConnector, score };
    }
  }
  return best;
}

function transitionRoom(plan: FloorPlan, toward: Room): Room {
  const entrances = plan.rooms.filter((room) => room.type === "exit");
  const connectors = connectorCandidates(plan);
  return nearestRoom(entrances.length ? entrances : connectors, center(toward)) ?? toward;
}

function createSameFloorLeg(plan: FloorPlan, from: Room, to: Room): RouteLeg {
  return routeLeg(plan.id, from, to, "start", "destination");
}

function createMultiFloorLegs(
  fromPlan: FloorPlan,
  toPlan: FloorPlan,
  from: Room,
  to: Room
): { legs: RouteLeg[]; transitions: string[] } {
  const fromBuilding = buildingForFloor(fromPlan.id);
  const toBuilding = buildingForFloor(toPlan.id);

  if (fromBuilding !== toBuilding) {
    const fromExit = transitionRoom(fromPlan, from);
    const toEntrance = transitionRoom(toPlan, to);
    return {
      legs: [
        routeLeg(fromPlan.id, from, fromExit, "start", "transition"),
        routeLeg(toPlan.id, toEntrance, to, "transition", "destination"),
      ],
      transitions: [`Leave ${fromBuilding} at ${fromExit.label || fromExit.id}; continue outdoors to ${toBuilding} and enter at ${toEntrance.label || toEntrance.id}. The between-building segment is not drawn because the floor plans contain no connector geometry.`],
    };
  }

  const connectors = chooseConnectorPair(fromPlan, toPlan, from, to);
  if (!connectors) {
    const fromExit = transitionRoom(fromPlan, from);
    const toEntrance = transitionRoom(toPlan, to);
    return {
      legs: [
        routeLeg(fromPlan.id, from, fromExit, "start", "transition"),
        routeLeg(toPlan.id, toEntrance, to, "transition", "destination"),
      ],
      transitions: [`No matching stair/lift is mapped on both floors. Use ${fromExit.label || fromExit.id} on ${fromPlan.title}, then continue to ${toPlan.title} and ${to.label}.`],
    };
  }

  return {
    legs: [
      routeLeg(fromPlan.id, from, connectors.from, "start", "transition"),
      routeLeg(toPlan.id, connectors.to, to, "transition", "destination"),
    ],
    transitions: [`Use the ${connectors.from.type === "lift" ? "lift" : "stairs"} at ${connectors.from.label || connectors.from.id} on ${fromPlan.title}; continue to the corresponding ${connectors.to.label || connectors.to.id} on ${toPlan.title}.`],
  };
}

export function calculateIndoorRoute(
  fromFloorId: string,
  fromRoomId: string,
  toFloorId: string,
  toRoomId: string
): IndoorRoute | null {
  const fromPlan = allFloorPlans[fromFloorId];
  const toPlan = allFloorPlans[toFloorId];
  const from = fromPlan && findRoom(fromPlan, fromRoomId);
  const to = toPlan && findRoom(toPlan, toRoomId);
  if (!fromPlan || !toPlan || !from || !to) return null;

  let legs: RouteLeg[];
  let transitions: string[] = [];
  if (fromFloorId === toFloorId) {
    legs = [createSameFloorLeg(fromPlan, from, to)];
  } else {
    ({ legs, transitions } = createMultiFloorLegs(fromPlan, toPlan, from, to));
  }
  const distanceMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  return {
    fromFloorId,
    fromRoomId,
    fromLabel: from.label,
    toFloorId,
    toRoomId,
    toLabel: to.label,
    legs,
    transitions,
    distanceMeters,
    walkingMinutes: Math.max(1, Math.ceil(distanceMeters / WALKING_METERS_PER_MINUTE)),
    isApproximate: true,
  };
}
