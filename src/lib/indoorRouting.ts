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
  pathQuality: "mapped" | "approximate";
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

const WALKABLE_ROOM_TYPES = new Set<Room["type"]>(["corridor", "exit", "open", "court"]);
const ROOM_EDGE_TOLERANCE = 8;

interface PortalPair {
  a: RoutePoint;
  b: RoutePoint;
}
interface WalkEdge {
  to: string;
  fromPoint: RoutePoint;
  toPoint: RoutePoint;
  cost: number;
}
interface EndpointOption {
  node: Room;
  direct: boolean;
  approximate: boolean;
  portalRoom: RoutePoint;
  portalWalkable: RoutePoint;
  cost: number;
}
interface RouteSegment {
  points: RoutePoint[];
  pathQuality: "mapped" | "approximate";
}
interface PreviousEdge {
  fromId: string;
  fromPoint: RoutePoint;
  toPoint: RoutePoint;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

/** Connects only rectangles whose mapped edges touch or have a small drafting gap. */
function roomPortalPair(a: Room, b: Room): PortalPair | null {
  const rightA = a.x + a.w;
  const bottomA = a.y + a.h;
  const rightB = b.x + b.w;
  const bottomB = b.y + b.h;
  const xOverlap = Math.min(rightA, rightB) - Math.max(a.x, b.x);
  const yOverlap = Math.min(bottomA, bottomB) - Math.max(a.y, b.y);

  const centerA = center(a);
  const centerB = center(b);
  const sharedY = Math.max(a.y, b.y);
  const sharedBottom = Math.min(bottomA, bottomB);
  const sharedX = Math.max(a.x, b.x);
  const sharedRight = Math.min(rightA, rightB);
  const yAim = !WALKABLE_ROOM_TYPES.has(a.type)
    ? centerA.y
    : !WALKABLE_ROOM_TYPES.has(b.type)
      ? centerB.y
      : (centerA.y + centerB.y) / 2;
  const xAim = !WALKABLE_ROOM_TYPES.has(a.type)
    ? centerA.x
    : !WALKABLE_ROOM_TYPES.has(b.type)
      ? centerB.x
      : (centerA.x + centerB.x) / 2;

  if (yOverlap > 0 && Math.abs(rightA - b.x) <= ROOM_EDGE_TOLERANCE) {
    const y = clamp(yAim, sharedY, sharedBottom);
    return { a: { x: rightA, y }, b: { x: b.x, y } };
  }
  if (yOverlap > 0 && Math.abs(rightB - a.x) <= ROOM_EDGE_TOLERANCE) {
    const y = clamp(yAim, sharedY, sharedBottom);
    return { a: { x: a.x, y }, b: { x: rightB, y } };
  }
  if (xOverlap > 0 && Math.abs(bottomA - b.y) <= ROOM_EDGE_TOLERANCE) {
    const x = clamp(xAim, sharedX, sharedRight);
    return { a: { x, y: bottomA }, b: { x, y: b.y } };
  }
  if (xOverlap > 0 && Math.abs(bottomB - a.y) <= ROOM_EDGE_TOLERANCE) {
    const x = clamp(xAim, sharedX, sharedRight);
    return { a: { x, y: a.y }, b: { x, y: bottomB } };
  }

  // A few campus map tiles meet at corners rather than a shared edge.
  // Permit only genuinely nearby corners, not long shortcuts across rooms.
  const nearestA = { x: clamp(center(b).x, a.x, rightA), y: clamp(center(b).y, a.y, bottomA) };
  const nearestB = { x: clamp(nearestA.x, b.x, rightB), y: clamp(nearestA.y, b.y, bottomB) };
  const gapX = Math.abs(nearestA.x - nearestB.x);
  const gapY = Math.abs(nearestA.y - nearestB.y);
  if (gapX <= ROOM_EDGE_TOLERANCE && gapY <= ROOM_EDGE_TOLERANCE && (gapX > 0 || gapY > 0)) {
    return { a: nearestA, b: nearestB };
  }

  return null;
}

function edgeCost(from: Room, to: Room, portal: PortalPair) {
  return distance(center(from), portal.a) +
    distance(portal.a, portal.b) +
    distance(portal.b, center(to));
}

function endpointOptions(room: Room, walkable: Room[], isStart: boolean, allowApproximate = false): EndpointOption[] {
  if (WALKABLE_ROOM_TYPES.has(room.type)) {
    return [{
      node: room,
      direct: true,
      approximate: false,
      portalRoom: center(room),
      portalWalkable: center(room),
      cost: 0,
    }];
  }

  const touching = walkable.flatMap((candidate) => {
    const portal = isStart ? roomPortalPair(room, candidate) : roomPortalPair(candidate, room);
    if (!portal) return [];
    const portalRoom = isStart ? portal.a : portal.b;
    const portalWalkable = isStart ? portal.b : portal.a;
    return [{
      node: candidate,
      direct: false,
      approximate: false,
      portalRoom,
      portalWalkable,
      cost: distance(center(room), portalRoom) +
        distance(portalRoom, portalWalkable) +
        distance(portalWalkable, center(candidate)),
    }];
  });
  if (touching.length > 0 || !allowApproximate) return touching;

  // Some legacy floor maps don't draw a continuous corridor beside every pin.
  // Keep a best-effort endpoint connection, but mark this route as approximate.
  return walkable.map((candidate) => {
    const sourceCenter = center(room);
    const walkableCenter = center(candidate);
    const portalRoom = {
      x: clamp(walkableCenter.x, room.x, room.x + room.w),
      y: clamp(walkableCenter.y, room.y, room.y + room.h),
    };
    const portalWalkable = {
      x: clamp(portalRoom.x, candidate.x, candidate.x + candidate.w),
      y: clamp(portalRoom.y, candidate.y, candidate.y + candidate.h),
    };
    return {
      node: candidate,
      direct: false,
      approximate: true,
      portalRoom,
      portalWalkable,
      cost: distance(sourceCenter, portalRoom) +
        distance(portalRoom, portalWalkable) +
        distance(portalWalkable, walkableCenter),
    };
  });
}

/**
 * Build a graph from mapped walkable regions and find a shortest route through
 * connected corridors/open spaces. If the floor map has disconnected or missing
 * connectors, return a flagged best-effort route rather than a silent dead end.
 */
function routeSegment(plan: FloorPlan, from: Room, to: Room): RouteSegment | null {
  if (from.id === to.id) return { points: [center(from)], pathQuality: "mapped" };

  const walkable = plan.rooms.filter((room) => WALKABLE_ROOM_TYPES.has(room.type));
  if (walkable.length === 0) return null;

  const adjacency = new Map<string, WalkEdge[]>();
  walkable.forEach((room) => adjacency.set(room.id, []));

  for (let i = 0; i < walkable.length; i += 1) {
    for (let j = i + 1; j < walkable.length; j += 1) {
      const a = walkable[i];
      const b = walkable[j];
      const portal = roomPortalPair(a, b);
      if (!portal) continue;
      const cost = edgeCost(a, b, portal);
      adjacency.get(a.id)?.push({ to: b.id, fromPoint: portal.a, toPoint: portal.b, cost });
      adjacency.get(b.id)?.push({ to: a.id, fromPoint: portal.b, toPoint: portal.a, cost });
    }
  }

  const exactStartOptions = endpointOptions(from, walkable, true);
  const exactEndOptions = endpointOptions(to, walkable, false);
  const startOptions = exactStartOptions.length ? exactStartOptions : endpointOptions(from, walkable, true, true);
  const endOptions = exactEndOptions.length ? exactEndOptions : endpointOptions(to, walkable, false, true);
  if (startOptions.length === 0 || endOptions.length === 0) return null;

  let bestCost = Number.POSITIVE_INFINITY;
  let bestPoints: RoutePoint[] | null = null;
  let bestQuality: RouteSegment["pathQuality"] = "mapped";

  for (const startOption of startOptions) {
    const distances = new Map<string, number>([[startOption.node.id, startOption.cost]]);
    const previous = new Map<string, PreviousEdge>();
    const unvisited = new Set(walkable.map((room) => room.id));

    while (unvisited.size > 0) {
      let currentId: string | undefined;
      let currentCost = Number.POSITIVE_INFINITY;
      for (const id of unvisited) {
        const value = distances.get(id) ?? Number.POSITIVE_INFINITY;
        if (value < currentCost) {
          currentCost = value;
          currentId = id;
        }
      }
      if (!currentId || !Number.isFinite(currentCost)) break;
      unvisited.delete(currentId);

      for (const edge of adjacency.get(currentId) ?? []) {
        if (!unvisited.has(edge.to)) continue;
        const nextCost = currentCost + edge.cost;
        if (nextCost < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
          distances.set(edge.to, nextCost);
          previous.set(edge.to, {
            fromId: currentId,
            fromPoint: edge.fromPoint,
            toPoint: edge.toPoint,
          });
        }
      }
    }

    for (const endOption of endOptions) {
      const walkableCost = distances.get(endOption.node.id);
      if (walkableCost === undefined) continue;
      const totalCost = walkableCost + endOption.cost;
      if (totalCost >= bestCost) continue;

      const reverseEdges: PreviousEdge[] = [];
      const reverseNodeIds: string[] = [endOption.node.id];
      let cursor = endOption.node.id;
      while (cursor !== startOption.node.id) {
        const edge = previous.get(cursor);
        if (!edge) break;
        reverseEdges.push(edge);
        cursor = edge.fromId;
        reverseNodeIds.push(cursor);
      }
      if (cursor !== startOption.node.id) continue;
      reverseEdges.reverse();
      const nodeIds = reverseNodeIds.reverse();

      const points: RoutePoint[] = [center(from)];
      const push = (point: RoutePoint) => appendPoint(points, point);
      if (!startOption.direct) {
        push(startOption.portalRoom);
        push(startOption.portalWalkable);
      }
      push(center(startOption.node));

      for (let index = 0; index < reverseEdges.length; index += 1) {
        const edge = reverseEdges[index];
        const nextNode = walkable.find((room) => room.id === nodeIds[index + 1]);
        push(edge.fromPoint);
        push(edge.toPoint);
        if (nextNode) push(center(nextNode));
      }

      if (!endOption.direct) {
        push(endOption.portalWalkable);
        push(endOption.portalRoom);
        push(center(to));
      }
      bestCost = totalCost;
      bestPoints = points;
      bestQuality = startOption.approximate || endOption.approximate ? "approximate" : "mapped";
    }
  }

  if (bestPoints) return { points: bestPoints, pathQuality: bestQuality };

  // The selected points can belong to disconnected mapped regions (for example,
  // an entrance overlaps an office block in the source diagram). Keep the route
  // usable while disclosing that geometry needs a site-plan connector correction.
  const approximateStarts = endpointOptions(from, walkable, true, true);
  const approximateEnds = endpointOptions(to, walkable, false, true);
  let fallback: { cost: number; start: EndpointOption; end: EndpointOption } | null = null;
  for (const startOption of approximateStarts) {
    for (const endOption of approximateEnds) {
      const cost = startOption.cost + distance(center(startOption.node), center(endOption.node)) + endOption.cost;
      if (!fallback || cost < fallback.cost) fallback = { cost, start: startOption, end: endOption };
    }
  }
  if (!fallback) return null;

  const points: RoutePoint[] = [center(from)];
  const push = (point: RoutePoint) => appendPoint(points, point);
  if (!fallback.start.direct) {
    push(fallback.start.portalRoom);
    push(fallback.start.portalWalkable);
  }
  push(center(fallback.start.node));
  push(center(fallback.end.node));
  if (!fallback.end.direct) {
    push(fallback.end.portalWalkable);
    push(fallback.end.portalRoom);
  }
  push(center(to));
  return { points, pathQuality: "approximate" };
}

function routeLeg(
  floorId: string,
  from: Room,
  to: Room,
  startKind: RouteLeg["startKind"],
  endKind: RouteLeg["endKind"]
): RouteLeg | null {
  const plan = allFloorPlans[floorId];
  const segment = routeSegment(plan, from, to);
  if (!segment) return null;
  const points = segment.points;
  const mapUnits = points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
  return {
    floorId,
    points,
    pathQuality: segment.pathQuality,
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

function createSameFloorLeg(plan: FloorPlan, from: Room, to: Room): RouteLeg | null {
  return routeLeg(plan.id, from, to, "start", "destination");
}

function createMultiFloorLegs(
  fromPlan: FloorPlan,
  toPlan: FloorPlan,
  from: Room,
  to: Room
): { legs: RouteLeg[]; transitions: string[] } | null {
  const fromBuilding = buildingForFloor(fromPlan.id);
  const toBuilding = buildingForFloor(toPlan.id);

  if (fromBuilding !== toBuilding) {
    const fromExit = transitionRoom(fromPlan, from);
    const toEntrance = transitionRoom(toPlan, to);
    const fromLeg = routeLeg(fromPlan.id, from, fromExit, "start", "transition");
    const toLeg = routeLeg(toPlan.id, toEntrance, to, "transition", "destination");
    if (!fromLeg || !toLeg) return null;
    return {
      legs: [fromLeg, toLeg],
      transitions: ["Leave " + fromBuilding + " at " + (fromExit.label || fromExit.id) + "; continue outdoors to " + toBuilding + " and enter at " + (toEntrance.label || toEntrance.id) + ". The between-building segment is not drawn because the floor plans contain no connector geometry."],
    };
  }

  const connectors = chooseConnectorPair(fromPlan, toPlan, from, to);
  if (!connectors) {
    const fromExit = transitionRoom(fromPlan, from);
    const toEntrance = transitionRoom(toPlan, to);
    const fromLeg = routeLeg(fromPlan.id, from, fromExit, "start", "transition");
    const toLeg = routeLeg(toPlan.id, toEntrance, to, "transition", "destination");
    if (!fromLeg || !toLeg) return null;
    return {
      legs: [fromLeg, toLeg],
      transitions: ["No matching stair/lift is mapped on both floors. Use " + (fromExit.label || fromExit.id) + " on " + fromPlan.title + ", then continue to " + toPlan.title + " and " + to.label + "."],
    };
  }

  const fromLeg = routeLeg(fromPlan.id, from, connectors.from, "start", "transition");
  const toLeg = routeLeg(toPlan.id, connectors.to, to, "transition", "destination");
  if (!fromLeg || !toLeg) return null;
  return {
    legs: [fromLeg, toLeg],
    transitions: ["Use the " + (connectors.from.type === "lift" ? "lift" : "stairs") + " at " + (connectors.from.label || connectors.from.id) + " on " + fromPlan.title + "; continue to the corresponding " + (connectors.to.label || connectors.to.id) + " on " + toPlan.title + "."],
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
    const leg = createSameFloorLeg(fromPlan, from, to);
    if (!leg) return null;
    legs = [leg];
  } else {
    const multiFloor = createMultiFloorLegs(fromPlan, toPlan, from, to);
    if (!multiFloor) return null;
    ({ legs, transitions } = multiFloor);
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
