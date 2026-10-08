import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getAllRooms, allFloorPlans, buildingSections } from "@/data/floorPlans";
import { X, Navigation2, ArrowRight, Footprints, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateIndoorRoute, type IndoorRoute } from "@/lib/indoorRouting";
import type { RouteAccessDecision } from "@/security/routeAccess";
import { personTypes, type PersonType, type Role, type SecurityLocation, type Visitor } from "@/security/types";

interface Props {
  onClose: () => void;
  onNavigate: (floorId: string, roomId: string) => void;
  visitors: Visitor[];
  onCheckRoute: (visitorId: string, route: IndoorRoute) => Promise<RouteAccessDecision>;
  onRouteChanged: () => void;
  onFocusRestrictedArea: (floorId: string, roomId: string) => void;
  accessRole: Role;
}

function getFloorOrder(floorId: string): number {
  const order: Record<string, number> = {
    "mb-gf": 0, "mb-f1": 1, "mb-f2": 2, "mb-f3": 3, "mb-f4": 4, "mb-f5": 5,
    "fb-gf": 10, "fb-f1": 11, "fb-f2": 12,
    "bb-f3": 23, "bb-f4": 24, "bb-f5": 25,
    sheds: 30, campus: -1,
  };
  return order[floorId] ?? 99;
}

function getBuilding(floorId: string): string {
  if (floorId.startsWith("mb-")) return "Main Building";
  if (floorId.startsWith("fb-")) return "Fisheries Block";
  if (floorId.startsWith("bb-")) return "B Block";
  if (floorId === "sheds") return "Campus Sheds";
  return "Campus";
}

export default function NavigationPanel({ onClose, onNavigate, visitors, onCheckRoute, onRouteChanged, onFocusRestrictedArea, accessRole }: Props) {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromRoom, setFromRoom] = useState<{ floorId: string; roomId: string; label: string } | null>(null);
  const [toRoom, setToRoom] = useState<{ floorId: string; roomId: string; label: string } | null>(null);
  const [activeInput, setActiveInput] = useState<"from" | "to" | null>(null);
  const [visitorCategory, setVisitorCategory] = useState<PersonType>(visitors[0]?.type ?? "General Visitor");
  const [visitorId, setVisitorId] = useState(visitors[0]?.id ?? "");
  const [routeDecision, setRouteDecision] = useState<RouteAccessDecision | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const allRooms = useMemo(() => getAllRooms(), []);
  const fullAccessRole = ["student", "faculty", "staff", "management", "admin", "security"].includes(accessRole);
  const categoryVisitors = visitors.filter((candidate) => candidate.type === visitorCategory);
  const visitor = categoryVisitors.find((candidate) => candidate.id === visitorId) ?? categoryVisitors[0];
  const activeAccessLabel = accessRole === "admin" ? "Admin" : accessRole.charAt(0).toUpperCase() + accessRole.slice(1);
  const route = useMemo(() => {
    if (!fromRoom || !toRoom) return null;
    return calculateIndoorRoute(fromRoom.floorId, fromRoom.roomId, toRoom.floorId, toRoom.roomId);
  }, [fromRoom, toRoom]);

  const searchResults = useMemo(() => {
    const q = (activeInput === "from" ? fromQuery : toQuery).trim().toLowerCase();
    if (!q) return [];

    return allRooms
      .map((item) => {
        const id = item.room.id.toLowerCase();
        const label = item.room.label.toLowerCase();
        const sublabel = item.room.sublabel?.toLowerCase() ?? "";
        const description = item.room.description?.toLowerCase() ?? "";

        let score = Number.POSITIVE_INFINITY;
        if (label === q || id === q) score = 0;
        else if (label.startsWith(q) || id.startsWith(q)) score = 1;
        else if (sublabel.startsWith(q)) score = 2;
        else if (label.includes(q) || id.includes(q)) score = 3;
        else if (sublabel.includes(q) || description.includes(q)) score = 4;

        return { item, score };
      })
      .filter(({ score }) => Number.isFinite(score))
      .sort((a, b) => a.score - b.score || a.item.room.label.localeCompare(b.item.room.label))
      .map(({ item }) => item)
      .slice(0, 20);
  }, [fromQuery, toQuery, activeInput, allRooms]);

  const directions = useMemo(() => {
    if (!fromRoom || !toRoom) return null;

    const steps: { text: string; icon: string }[] = [];
    const fromBuilding = getBuilding(fromRoom.floorId);
    const toBuilding = getBuilding(toRoom.floorId);
    const fromPlan = allFloorPlans[fromRoom.floorId];
    const toPlan = allFloorPlans[toRoom.floorId];

    steps.push({ text: `Start at ${fromRoom.label} (${fromPlan?.title || fromRoom.floorId})`, icon: "📍" });

    if (fromRoom.floorId === toRoom.floorId) {
      steps.push({ text: `Walk through the corridor to ${toRoom.label}`, icon: "🚶" });
    } else if (fromBuilding === toBuilding) {
      const fromFloor = getFloorOrder(fromRoom.floorId);
      const toFloor = getFloorOrder(toRoom.floorId);
      const direction = toFloor > fromFloor ? "up" : "down";
      const floors = Math.abs(toFloor - fromFloor);
      const sourceLeg = route?.legs[0];
      const destinationLeg = route?.legs[route.legs.length - 1];
      steps.push({ text: `Walk to ${sourceLeg?.endLabel || "the mapped stair or lift"}`, icon: "🚶" });
      steps.push({ text: `Go ${direction} ${floors} floor${floors > 1 ? 's' : ''} to ${toPlan?.title || toRoom.floorId} via ${destinationLeg?.startLabel || "the corresponding connector"}`, icon: direction === "up" ? "⬆️" : "⬇️" });
      steps.push({ text: `Find ${toRoom.label} along the corridor`, icon: "🚶" });
    } else {
      const sourceLeg = route?.legs[0];
      const destinationLeg = route?.legs[route.legs.length - 1];
      steps.push({ text: `Exit ${fromBuilding} at ${sourceLeg?.endLabel || "a mapped entrance/exit"}`, icon: "🚪" });
      steps.push({ text: `Continue outdoors to ${toBuilding}; no between-building route geometry is available`, icon: "🚶" });
      steps.push({ text: `Enter ${toBuilding} at ${destinationLeg?.startLabel || "a mapped entrance/exit"}`, icon: "🚪" });
      const toFloorNum = getFloorOrder(toRoom.floorId) % 10;
      if (toFloorNum > 0) {
        steps.push({ text: `Take the stairs/lift to ${toPlan?.title || toRoom.floorId}`, icon: "⬆️" });
      }
      steps.push({ text: `Find ${toRoom.label} along the corridor`, icon: "🚶" });
    }

    steps.push({ text: `Arrive at ${toRoom.label}`, icon: "🏁" });
    return steps;
  }, [fromRoom, toRoom, route]);

  const selectRoom = (floorId: string, roomId: string, label: string) => {
    setRouteDecision(null);
    setCheckError(null);
    onRouteChanged();
    if (activeInput === "from") {
      setFromRoom({ floorId, roomId, label });
      setFromQuery(label);
    } else {
      setToRoom({ floorId, roomId, label });
      setToQuery(label);
    }
    setActiveInput(null);
  };

  const clearRouteCheck = () => {
    setRouteDecision(null);
    setCheckError(null);
    onRouteChanged();
  };

  const selectAlternative = (location: SecurityLocation) => {
    const room = allFloorPlans[location.floorId]?.rooms.find((candidate) => candidate.id === location.roomId);
    if (!room) {
      setCheckError(`The permitted location "${location.name}" is not mapped to a room.`);
      return;
    }
    clearRouteCheck();
    setToRoom({ floorId: location.floorId, roomId: room.id, label: room.label });
    setToQuery(room.label);
    setActiveInput(null);
  };

  const checkAndShowRoute = async () => {
    if ((!fullAccessRole && !visitor) || !route || !fromRoom || !toRoom) return;
    setIsCheckingAccess(true);
    setCheckError(null);
    setRouteDecision(null);
    try {
      const decision = await onCheckRoute(fullAccessRole ? null : visitor.id, route);
      setRouteDecision(decision);
      if (decision.allowed) {
        onNavigate(fromRoom.floorId, fromRoom.roomId);
        onClose();
      } else {
        const restrictedArea = decision.deniedAreas[0];
        if (restrictedArea) onFocusRestrictedArea(restrictedArea.floorId, restrictedArea.roomId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify route access.";
      setCheckError(message);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-96 max-w-full bg-card border-l border-border shadow-elevated z-20 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Navigation2 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-foreground">Directions</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* From / To inputs */}
      <div className="p-4 space-y-3 border-b border-border relative">
        <div>
          {!fullAccessRole && <label htmlFor="route-visitor-category" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Visitor Category</label>}
          {!fullAccessRole && <select
            id="route-visitor-category"
            value={visitorCategory}
            onChange={(event) => {
              setVisitorCategory(event.target.value as PersonType);
              setVisitorId("");
              clearRouteCheck();
            }}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary outline-none"
          >
            {personTypes.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>}
          {!fullAccessRole && <p className="mt-1 text-[10px] text-muted-foreground">
            Uses the existing {visitorCategory} access rules.
          </p>}
        </div>
        {!fullAccessRole && <div>
          <label htmlFor="route-visitor" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Registered Visitor</label>
          <select
            id="route-visitor"
            value={visitor?.id ?? ""}
            onChange={(event) => {
              setVisitorId(event.target.value);
              clearRouteCheck();
            }}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary outline-none"
          >
            {categoryVisitors.length === 0 && <option value="">No registered visitors in this category</option>}
            {categoryVisitors.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.type}</option>
            ))}
          </select>
          {visitor && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Existing {visitor.type} permissions · {visitor.status}
            </p>
          )}
        </div>}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">From</label>
          <input
            value={fromQuery}
            onChange={(e) => { clearRouteCheck(); setFromQuery(e.target.value); setActiveInput("from"); setFromRoom(null); }}
            onFocus={() => setActiveInput("from")}
            placeholder="Search starting room..."
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
          />
        </div>
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="h-3 w-3 text-primary rotate-90" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">To</label>
          <input
            value={toQuery}
            onChange={(e) => { clearRouteCheck(); setToQuery(e.target.value); setActiveInput("to"); setToRoom(null); }}
            onFocus={() => setActiveInput("to")}
            placeholder="Search destination room..."
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
          />
        </div>

        {/* Search dropdown */}
        {activeInput && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-card border border-border rounded-xl shadow-elevated z-50 max-h-48 overflow-y-auto">
            <div className="p-1.5">
              {searchResults.map((r, i) => (
                <button
                  key={`${r.floorId}-${r.room.id}-${i}`}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors rounded-lg"
                  onClick={() => selectRoom(r.floorId, r.room.id, r.room.label)}
                >
                  <span className="font-medium text-foreground">{r.room.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.floorTitle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Directions */}
      <div className="flex-1 overflow-y-auto p-4">
        {directions && route && visitor ? (
          <div className="space-y-0">
            {!routeDecision && (
              <p className="mb-3 rounded-lg border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
                {fullAccessRole
                  ? `${activeAccessLabel} access: all mapped campus rooms are available.`
                  : `Check this visitor’s existing category permissions before generating directions.`}
              </p>
            )}

            {routeDecision?.allowed && (
              <div className="mb-3 rounded-lg border border-emerald-600/30 bg-emerald-500/5 p-3" role="status">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> Access Allowed
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Approx. {route.distanceMeters.toFixed(1)} m mapped distance · {route.walkingMinutes} min walking
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Estimate assumes 0.05 m per map unit; plans have no scale or walkable-path graph.
                  {route.legs.length > 1 && " Vertical/outdoor transition distance is not included."}
                </p>
              </div>
            )}

            {routeDecision?.allowed && directions.map((step, i) => (
              <div key={i} className="flex gap-3 relative">
                {i < directions.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm z-10">{step.icon}</div>
                <div className="pb-4 pt-1"><p className="text-sm text-foreground">{step.text}</p></div>
              </div>
            ))}

            {routeDecision && !routeDecision.allowed && (
              <div className="mb-3 rounded-lg border border-red-600/40 bg-red-500/5 p-3" role="alert">
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <ShieldAlert className="h-4 w-4" /> Access Restricted
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {visitor.name} ({visitor.type}) does not have permission to access {routeDecision.deniedAreas.map((area) => area.label).join(", ")}.
                  No route was generated.
                </p>
                {routeDecision.permittedAlternatives.length > 0 && (
                  <div className="mt-3">
                    <label htmlFor="permitted-alternative" className="mb-1 block text-xs font-medium text-foreground">Choose a permitted destination instead</label>
                    <select
                      id="permitted-alternative"
                      defaultValue=""
                      onChange={(event) => {
                        const alternative = routeDecision.permittedAlternatives.find((location) => location.id === event.target.value);
                        if (alternative) selectAlternative(alternative);
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="" disabled>Select an allowed location</option>
                      {routeDecision.permittedAlternatives.map((location) => (
                        <option key={location.id} value={location.id}>{location.name} · {location.floorLabel}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {checkError && <p className="mb-3 text-xs text-red-700" role="alert">{checkError}</p>}

            <div className="pt-2">
              <Button className="w-full gap-2" onClick={checkAndShowRoute} disabled={isCheckingAccess || (!fullAccessRole && !visitor)}>
                <Footprints className="h-4 w-4" />
                {isCheckingAccess ? "Checking access..." : "Check Access & Generate Route"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
            <Navigation2 className="h-10 w-10 opacity-20" />
            <p className="text-sm">Select start and destination rooms to get directions</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
