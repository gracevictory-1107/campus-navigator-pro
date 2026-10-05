import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { FloorPlan, Room, RoomType } from "@/data/floorPlans";
import type { RouteLeg } from "@/lib/indoorRouting";
import { ZoomIn, ZoomOut, Maximize2, LocateFixed, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomLegend from "./RoomLegend";

const roomFills: Record<RoomType, string> = {
  lab: "hsl(var(--room-lab))", class: "hsl(var(--room-class))", hod: "hsl(var(--room-hod))",
  stairs: "hsl(var(--room-stairs))", lift: "hsl(var(--room-lift))", wc: "hsl(var(--room-wc))",
  exit: "hsl(var(--room-exit))", corridor: "hsl(var(--room-corridor))", staff: "hsl(var(--room-staff))",
  innov: "hsl(var(--room-innov))", open: "hsl(var(--room-open))", canteen: "hsl(var(--room-canteen))",
  dean: "hsl(var(--room-dean))", court: "hsl(var(--room-court))",
};

const roomStrokes: Record<RoomType, string> = {
  lab: "hsl(var(--room-lab-stroke))", class: "hsl(var(--room-class-stroke))", hod: "hsl(var(--room-hod-stroke))",
  stairs: "hsl(var(--room-stairs-stroke))", lift: "hsl(var(--room-lift-stroke))", wc: "hsl(var(--room-wc-stroke))",
  exit: "hsl(var(--room-exit-stroke))", corridor: "hsl(var(--room-corridor-stroke))", staff: "hsl(var(--room-staff-stroke))",
  innov: "hsl(var(--room-innov-stroke))", open: "hsl(var(--room-open-stroke))", canteen: "hsl(var(--room-canteen-stroke))",
  dean: "hsl(var(--room-dean-stroke))", court: "hsl(var(--room-court-stroke))",
};

const roomTextColors: Record<RoomType, string> = {
  lab: "hsl(var(--room-lab-text))", class: "hsl(var(--room-class-text))", hod: "hsl(var(--room-hod-text))",
  stairs: "hsl(var(--room-stairs-text))", lift: "hsl(var(--room-lift-text))", wc: "hsl(var(--room-wc-text))",
  exit: "hsl(var(--room-exit-text))", corridor: "hsl(var(--room-corridor-text))", staff: "hsl(var(--room-staff-text))",
  innov: "hsl(var(--room-innov-text))", open: "hsl(var(--room-open-text))", canteen: "hsl(var(--room-canteen-text))",
  dean: "hsl(var(--room-dean-text))", court: "hsl(var(--room-court-text))",
};

function getRouteDots(points: RouteLeg["points"]) {
  const segments = points.slice(1).map((point, index) => {
    const start = points[index];
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return { start, dx, dy, length: Math.hypot(dx, dy) };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  const dots: { x: number; y: number }[] = [];
  const spacing = 20;

  for (let distance = 12; distance < totalLength - 12; distance += spacing) {
    let remaining = distance;
    const segment = segments.find((candidate) => {
      if (remaining <= candidate.length) return true;
      remaining -= candidate.length;
      return false;
    });
    if (segment && segment.length > 0) {
      const ratio = remaining / segment.length;
      dots.push({ x: segment.start.x + segment.dx * ratio, y: segment.start.y + segment.dy * ratio });
    }
  }
  return dots;
}

export interface PersonMarker {
  id: string;
  roomId: string;
  name: string;
  subtitle: string;
  access: "authorized" | "restricted";
}

export interface CameraPin {
  id: string;
  roomId: string;
  highlighted?: boolean;
}

interface Props {
  plan: FloorPlan;
  highlightRoomId?: string;
  onRoomClick?: (room: Room) => void;
  categoryFilter?: RoomType | null;
  routeFromId?: string;
  routeToId?: string;
  routeLeg?: RouteLeg;
  markers?: PersonMarker[];
  onMarkerClick?: (id: string) => void;
  cameras?: CameraPin[];
  onCameraClick?: (id: string) => void;
  restrictedRoomIds?: string[];
}

export default function FloorPlanSVG({ plan, highlightRoomId, onRoomClick, categoryFilter, routeFromId, routeToId, routeLeg, markers, onMarkerClick, cameras, onCameraClick, restrictedRoomIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const fitScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 1;
    return Math.min(
      Math.max(0.05, (container.clientWidth - 40) / plan.svgWidth),
      Math.max(0.05, (container.clientHeight - 40) / plan.svgHeight),
      1.5
    );
  }, [plan.svgWidth, plan.svgHeight]);

  // An undersized map is centered; an oversized map must cover the viewport.
  const boundedView = useCallback((scale: number, x: number, y: number) => {
    const container = containerRef.current;
    if (!container) return { scale, x, y };
    const width = plan.svgWidth * scale;
    const height = plan.svgHeight * scale;
    return {
      scale,
      x: width <= container.clientWidth ? (container.clientWidth - width) / 2 : Math.min(0, Math.max(container.clientWidth - width, x)),
      y: height <= container.clientHeight ? (container.clientHeight - height) / 2 : Math.min(0, Math.max(container.clientHeight - height, y)),
    };
  }, [plan.svgWidth, plan.svgHeight]);

  const resetView = useCallback(() => {
    const scale = fitScale();
    const container = containerRef.current;
    if (!container) return;
    setView(boundedView(scale, (container.clientWidth - plan.svgWidth * scale) / 2, (container.clientHeight - plan.svgHeight * scale) / 2));
  }, [fitScale, boundedView, plan.svgWidth, plan.svgHeight]);

  useEffect(() => {
    resetView();
    const ro = new ResizeObserver(resetView);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resetView, plan.id]);

  // Every zoom starts from the actual center of the plan, never the cursor or an old pan offset.
  const zoomTo = useCallback((requestedScale: number) => {
    const container = containerRef.current;
    if (!container) return;
    const scale = Math.max(fitScale(), Math.min(4, requestedScale));
    setView(boundedView(
      scale,
      (container.clientWidth - plan.svgWidth * scale) / 2,
      (container.clientHeight - plan.svgHeight * scale) / 2
    ));
  }, [fitScale, boundedView, plan.svgWidth, plan.svgHeight]);

  const scaleRef = useRef(view.scale);
  scaleRef.current = view.scale;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      zoomTo(scaleRef.current * Math.exp(-delta * 0.0015));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  // Auto-zoom to highlighted room
  useEffect(() => {
    if (!highlightRoomId || !containerRef.current) return;
    const room = plan.rooms.find((r) => r.id === highlightRoomId);
    if (!room) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const targetScale = Math.min(2.5, Math.max(fitScale(), 1.5));
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    setView(boundedView(targetScale, cw / 2 - cx * targetScale, ch / 2 - cy * targetScale));
  }, [highlightRoomId, plan.rooms, fitScale, boundedView]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: scaleRef.current };
      setIsDragging(false);
    } else if (pointers.current.size === 1) {
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      if (pinch.current.distance > 0) zoomTo(pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance);
      return;
    }
    const last = lastPointer.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (dx || dy) {
      setIsDragging(true);
      setView((previous) => boundedView(previous.scale, previous.x + dx, previous.y + dy));
    }
  }, [boundedView, zoomTo]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    lastPointer.current = pointers.current.size === 1 ? [...pointers.current.values()][0] : null;
    setIsDragging(false);
  }, []);

  const zoom = (factor: number) => {
    zoomTo(scaleRef.current * factor);
  };

  const isVerticalLabel = (room: Room) => room.h > room.w * 1.8;

  // Route line between two rooms
  const routeLine = useMemo(() => {
    if (!routeFromId || !routeToId) return null;
    const from = plan.rooms.find((r) => r.id === routeFromId);
    const to = plan.rooms.find((r) => r.id === routeToId);
    if (!from || !to) return null;
    return {
      x1: from.x + from.w / 2, y1: from.y + from.h / 2,
      x2: to.x + to.w / 2, y2: to.y + to.h / 2,
    };
  }, [routeFromId, routeToId, plan.rooms]);

  return (
    <div className="relative h-full w-full">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(1.3)} aria-label="Zoom in" title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(0.7)} aria-label="Zoom out" title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoomTo(1)} aria-label="Reset zoom" title="Reset (100%)">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={resetView} aria-label="Fit to screen" title="Fit to screen">
          <Maximize2 className="h-4 w-4" />
        </Button>
        {highlightRoomId && (
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => {
            const room = plan.rooms.find(r => r.id === highlightRoomId);
            if (room && containerRef.current) {
              const { clientWidth: cw, clientHeight: ch } = containerRef.current;
              const targetScale = 2;
              setView(boundedView(targetScale, cw / 2 - (room.x + room.w / 2) * targetScale, ch / 2 - (room.y + room.h / 2) * targetScale));
            }
          }}>
            <LocateFixed className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Zoom level */}
      <div className="absolute bottom-3 left-3 z-10 text-xs text-muted-foreground bg-card/90 px-2 py-1 rounded-md shadow-soft">
        {Math.round(view.scale * 100)}%
      </div>

      {/* Legend */}
      <RoomLegend />

      {/* SVG */}
      <div
        ref={containerRef}
        className={`h-full w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
            {/* Pulse animation for highlighted rooms */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
            transition: isDragging || pinch.current ? "none" : "transform 180ms ease-out",
          }}>
            {/* Labels */}
            {plan.labels?.map((label, i) => (
              <text
                key={i} x={label.x} y={label.y}
                textAnchor={label.anchor || "start"}
                fill={label.color === "green" ? "hsl(145, 55%, 40%)" : label.color === "amber" ? "hsl(30, 70%, 45%)" : "hsl(var(--primary))"}
                fontSize="10" letterSpacing="0.5" fontFamily="var(--font-body)" fontWeight="600"
              >
                {label.text}
              </text>
            ))}

            {/* Legacy route line */}
            {!routeLeg && routeLine && (
              <g>
                <line
                  x1={routeLine.x1} y1={routeLine.y1} x2={routeLine.x2} y2={routeLine.y2}
                  stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 4"
                  markerEnd="url(#arrowhead)" opacity="0.7"
                >
                  <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
                </line>
              </g>
            )}

            {/* Rooms */}
            {plan.rooms.map((room) => {
              const isHighlighted = highlightRoomId === room.id;
              const isHovered = hoveredRoom === room.id;
              const vertical = isVerticalLabel(room);
              const cx = room.x + room.w / 2;
              const cy = room.y + room.h / 2;
              const clickable = room.type !== "corridor";
              const dimmed = categoryFilter && room.type !== categoryFilter && room.type !== "corridor";
              const isRouteEnd = room.id === routeFromId || room.id === routeToId;

              return (
                <g
                  key={room.id}
                  className={`transition-all duration-150 ${clickable ? 'cursor-pointer' : ''}`}
                  onMouseEnter={() => setHoveredRoom(room.id)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  onClick={() => clickable && onRoomClick?.(room)}
                  opacity={dimmed ? 0.25 : 1}
                >
                  {/* Pulse ring for highlighted */}
                  {isHighlighted && (
                    <rect
                      x={room.x - 4} y={room.y - 4}
                      width={room.w + 8} height={room.h + 8}
                      rx={8} fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5"
                    >
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                  )}
                  {/* Route end marker */}
                  {isRouteEnd && (
                    <rect
                      x={room.x - 2} y={room.y - 2}
                      width={room.w + 4} height={room.h + 4}
                      rx={7} fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="2.5"
                    />
                  )}
                  <rect
                    x={room.x} y={room.y} width={room.w} height={room.h} rx={6}
                    fill={roomFills[room.type]}
                    stroke={isHighlighted ? "hsl(var(--primary))" : roomStrokes[room.type]}
                    strokeWidth={isHighlighted ? 3 : isHovered ? 2 : 1.2}
                    style={{
                      filter: isHighlighted ? "drop-shadow(0 0 8px hsl(230 80% 56% / 0.4))" : isHovered ? "drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))" : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                  {room.label && (
                    <text
                      x={cx} y={room.sublabel ? cy - 6 : cy}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={roomTextColors[room.type]}
                      fontSize={room.type === "corridor" ? 8 : room.w > 150 && room.h > 100 ? 11 : 9}
                      fontFamily="var(--font-body)"
                      fontWeight={room.type === "corridor" ? "400" : "600"}
                      pointerEvents="none"
                      transform={vertical ? `rotate(-90,${cx},${cy})` : undefined}
                    >
                      {room.label}
                    </text>
                  )}
                  {room.sublabel && (
                    <text
                      x={cx} y={cy + 10}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={roomTextColors[room.type]}
                      fontSize={8} fontFamily="var(--font-body)" fontWeight="400" opacity={0.7}
                      pointerEvents="none"
                      transform={vertical ? `rotate(-90,${cx},${cy + 10})` : undefined}
                    >
                      {room.sublabel}
                    </text>
                  )}
                </g>
              );
            })}

            {routeLeg && (
              <g pointerEvents="none">
                {getRouteDots(routeLeg.points).map((point, index) => (
                  <circle
                    key={`route-dot-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="2.8"
                    fill="hsl(145, 65%, 36%)"
                    stroke="white"
                    strokeWidth="1"
                  />
                ))}
                {[
                  { id: routeLeg.startRoomId, label: routeLeg.startKind === "start" ? "S" : "T", kind: routeLeg.startKind },
                  { id: routeLeg.endRoomId, label: routeLeg.endKind === "destination" ? "D" : "T", kind: routeLeg.endKind },
                ].map((marker, index) => {
                  const room = plan.rooms.find((item) => item.id === marker.id);
                  if (!room) return null;
                  const x = room.x + room.w / 2;
                  const y = room.y - 13;
                  const color = marker.kind === "destination" ? "hsl(145, 65%, 36%)" : marker.kind === "start" ? "hsl(145, 65%, 36%)" : "hsl(38, 90%, 48%)";
                  return (
                    <g key={`route-marker-${index}`}>
                      <circle cx={x} cy={y} r="9" fill={color} stroke="white" strokeWidth="2" />
                      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="700">
                        {marker.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Route markers */}
            {[routeFromId, routeToId].map((id, idx) => {
              if (!id) return null;
              const room = plan.rooms.find(r => r.id === id);
              if (!room) return null;
              const cx = room.x + room.w / 2;
              const cy = room.y - 12;
              return (
                <g key={`marker-${idx}`}>
                  <circle cx={cx} cy={cy} r={8} fill={idx === 0 ? "hsl(145, 55%, 40%)" : "hsl(var(--primary))"} />
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="700">
                    {idx === 0 ? "A" : "B"}
                  </text>
                </g>
              );
            })}

            {/* Restricted zones */}
            {restrictedRoomIds?.map((id) => {
              const room = plan.rooms.find((r) => r.id === id);
              if (!room) return null;
              const markerX = room.x + room.w - 10;
              const markerY = room.y + 10;
              return (
                <g key={`rz-${id}`} pointerEvents="none">
                  <rect x={room.x + 2} y={room.y + 2} width={room.w - 4} height={room.h - 4} rx={5}
                    fill="hsl(var(--status-restricted) / 0.2)" stroke="hsl(var(--status-restricted))"
                    strokeWidth={2.5} strokeDasharray="5 3" />
                  <circle cx={markerX} cy={markerY} r={9} fill="hsl(var(--status-restricted))" stroke="white" strokeWidth={1.5} />
                  <text x={markerX} y={markerY + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={11} fontWeight={800}>!</text>
                  <title>{`${room.label || "Area"} — access restricted`}</title>
                </g>
              );
            })}

            {/* Camera pins */}
            {cameras?.map((cam) => {
              const room = plan.rooms.find((r) => r.id === cam.roomId);
              if (!room) return null;
              const x = room.x + room.w - 12, y = room.y + 12;
              return (
                <g key={cam.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onCameraClick?.(cam.id); }}>
                  {cam.highlighted && (
                    <circle cx={x} cy={y} r={13} fill="none" stroke="hsl(var(--status-restricted))" strokeWidth={2}>
                      <animate attributeName="r" values="9;14;9" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <rect x={x - 9} y={y - 7} width={18} height={14} rx={3} fill="hsl(var(--foreground))" opacity={0.85} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={6} fontWeight={700} fill="hsl(var(--background))" pointerEvents="none">
                    {cam.id.replace("CAM-", "C")}
                  </text>
                </g>
              );
            })}

            {/* Current-location person markers: colour = access status only */}
            {markers?.map((m) => {
              const room = plan.rooms.find((r) => r.id === m.roomId);
              if (!room) return null;
              const tone = m.access === "restricted" ? "--status-restricted" : "--status-authorized";
              return (
                <g key={m.id} className="cursor-pointer"
                  style={{ transform: `translate(${room.x + room.w / 2}px, ${room.y + room.h / 2}px)`, transition: "transform 600ms ease-in-out" }}
                  onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}>
                  <circle r={14} fill={`hsl(var(${tone}) / 0.2)`}>
                    <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r={7} fill={`hsl(var(${tone}))`} stroke="hsl(var(--card))" strokeWidth={2} />
                  <g transform="translate(0,-14)">
                    <rect x={-44} y={-22} width={88} height={20} rx={4} fill="hsl(var(--card))" stroke={`hsl(var(${tone}))`} strokeWidth={1} />
                    <text y={-14} textAnchor="middle" fontSize={7} fontWeight={700} fill="hsl(var(--foreground))" pointerEvents="none">{m.name}</text>
                    <text y={-6} textAnchor="middle" fontSize={6} fill="hsl(var(--muted-foreground))" pointerEvents="none">{m.subtitle}</text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
