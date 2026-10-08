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

const WALKABLE_TYPES = new Set<Room["type"]>([
  "corridor",
  "open",
  "exit",
  "court",
  "stairs",
  "lift",
]);

const WALKABLE_GAP = 8;

function rectGap(a: Room, b: Room): number {
  const gapX = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const gapY = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0);
  return Math.hypot(gapX, gapY);
}

function nearestPointsBetweenRooms(a: Room, b: Room): { a: RoutePoint; b: RoutePoint; gap: number } {
  const overlapLeft = Math.max(a.x, b.x);
  const overlapRight = Math.min(a.x + a.w, b.x + b.w);
  const overlapTop = Math.max(a.y, b.y);
  const overlapBottom = Math.min(a.y + a.h, b.y + b.h);

  if (overlapLeft <= overlapRight && overlapTop <= overlapBottom) {
    const point = {
      x: (overlapLeft + overlapRight) / 2,
      y: (overlapTop + overlapBottom) / 2,
    };
    return { a: point, b: point, gap: 0 };
  }

  const aPoint = {
    x: Math.min(Math.max(center(b).x, a.x), a.x + a.w),
    y: Math.min(Math.max(center(b).y, a.y), a.y + a.h),
  };
  const bPoint = {
    x: Math.min(Math.max(center(a).x, b.x), b.x + b.w),
    y: Math.min(Math.max(center(a).y, b.y), b.y + b.h),
  };
  return { a: aPoint, b: bPoint, gap: distance(aPoint, bPoint) };
}

function buildWalkableRoute(plan: FloorPlan, from: Room, to: Room): RoutePoint[] | null {
  if (from.id === to.id) return [center(from)];

  const walkable = plan.rooms.filter((room) => WALKABLE_TYPES.has(room.type));
  if (walkable.length === 0) return null;

  const nodes = [from, ...walkable.filter((room) => room.id !== from.id && room.id !== to.id), to];
  const startIndex = 0;
  const destinationIndex = nodes.length - 1;
  const distances = new Array(nodes.length).fill(Number.POSITIVE_INFINITY);
  const previous = new Array<number>(nodes.length).fill(-1);
  const visited = new Set<number>();
  distances[startIndex] = 0;

  while (visited.size < nodes.length) {
    let current = -1;
    let best = Number.POSITIVE_INFINITY;
    for (let index = 0; index < nodes.length; index += 1) {
      if (!visited.has(index) && distances[index] < best) {
        current = index;
        best = distances[index];
      }
    }
    if (current === -1) break;
    visited.add(current);
    if (current === destinationIndex) break;

    for (let next = 0; next < nodes.length; next += 1) {
      if (next === current || visited.has(next)) continue;
      const link = nearestPointsBetweenRooms(nodes[current], nodes[next]);
      if (link.gap > WALKABLE_GAP) continue;

      const centerDistance = distance(center(nodes[current]), center(nodes[next]));
      const cost = link.gap + centerDistance * 0.05;
      const candidate = distances[current] + cost;
      if (candidate < distances[next]) {
        distances[next] = candidate;
        previous[next] = current;
      }
    }
  }

  if (!Number.isFinite(distances[destinationIndex])) return null;

  const nodePath: number[] = [];
  for (let current = destinationIndex; current !== -1; current = previous[current]) {
    nodePath.unshift(current);
  }
  if (nodePath[0] !== startIndex) return null;

  const points: RoutePoint[] = [center(from)];
  for (let index = 1; index < nodePath.length; index += 1) {
    const fromRoom = nodes[nodePath[index - 1]];
    const toRoom = nodes[nodePath[index]];
    const link = nearestPointsBetweenRooms(fromRoom, toRoom);
    appendPoint(points, link.a);
    appendPoint(points, link.b);
  }
  appendPoint(points, center(to));
  return points.length >= 2 ? points : null;
}

function routeSegment(plan: FloorPlan, from: Room, to: Room): RoutePoint[] {
  const graphRoute = buildWalkableRoute(plan, from, to);
  if (graphRoute) return graphRoute;

  // Some concept maps contain disconnected regions without a walkable connector.
  // Keep those routes explicitly approximate rather than inventing a path through rooms.
  return [center(from), center(to)];
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
