import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { FloorPlan, Room, RoomType } from "@/data/floorPlans";
import { ZoomIn, ZoomOut, Maximize2, LocateFixed } from "lucide-react";
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

interface Props {
  plan: FloorPlan;
  highlightRoomId?: string;
  onRoomClick?: (room: Room) => void;
  categoryFilter?: RoomType | null;
  routeFromId?: string;
  routeToId?: string;
}

type View = { scale: number; x: number; y: number };

function centeredView(width: number, height: number, mapWidth: number, mapHeight: number, scale: number): View {
  return {
    scale,
    x: (width - mapWidth * scale) / 2,
    y: (height - mapHeight * scale) / 2,
  };
}

function boundedView(view: View, width: number, height: number, mapWidth: number, mapHeight: number): View {
  const boundAxis = (offset: number, viewport: number, content: number) =>
    content <= viewport ? (viewport - content) / 2 : Math.max(viewport - content, Math.min(0, offset));
  return {
    ...view,
    x: boundAxis(view.x, width, mapWidth * view.scale),
    y: boundAxis(view.y, height, mapHeight * view.scale),
  };
}

export default function FloorPlanSVG({ plan, highlightRoomId, onRoomClick, categoryFilter, routeFromId, routeToId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const dragged = useRef(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const padding = 40;
    const fitScale = Math.min((cw - padding * 2) / plan.svgWidth, (ch - padding * 2) / plan.svgHeight, 1.5);
    if (fitScale <= 0) return;
    setView(centeredView(cw, ch, plan.svgWidth, plan.svgHeight, fitScale));
  }, [plan.svgWidth, plan.svgHeight]);

  useEffect(() => {
    resetView();
    const ro = new ResizeObserver(resetView);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resetView, plan.id]);

  // Auto-zoom to highlighted room
  useEffect(() => {
    if (!highlightRoomId || !containerRef.current) return;
    const room = plan.rooms.find((r) => r.id === highlightRoomId);
    if (!room) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const targetScale = Math.min(2.5, Math.max(view.scale, 1.5));
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    setView(boundedView({ scale: targetScale, x: cw / 2 - cx * targetScale, y: ch / 2 - cy * targetScale }, cw, ch, plan.svgWidth, plan.svgHeight));
  }, [highlightRoomId]);

  const zoom = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const { clientWidth, clientHeight } = container;
    setView(previous => {
      const minScale = Math.min((clientWidth - 40) / plan.svgWidth, (clientHeight - 40) / plan.svgHeight, 1.5);
      const next = Math.max(minScale, Math.min(Math.max(4, minScale), previous.scale * factor));
      return centeredView(clientWidth, clientHeight, plan.svgWidth, plan.svgHeight, next);
    });
  }, [plan.svgWidth, plan.svgHeight]);

  // A non-passive wheel listener stops browser scrolling/pinch-zoom while the map is active.
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      zoomRef.current(Math.exp(-Math.max(-100, Math.min(100, dy)) * 0.0015));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dragged.current = false;
      setIsDragging(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
      lastPointer.current = null;
    }
    containerRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const container = containerRef.current;
    if (!container) return;
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance.current && distance > 0) zoom(distance / pinchDistance.current);
      pinchDistance.current = distance;
      dragged.current = true;
    } else if (lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        dragged.current = true;
        setView(previous => boundedView({ ...previous, x: previous.x + dx, y: previous.y + dy }, container.clientWidth, container.clientHeight, plan.svgWidth, plan.svgHeight));
      }
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, [zoom, plan.svgWidth, plan.svgHeight]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDistance.current = null;
    lastPointer.current = pointers.current.size === 1 ? Array.from(pointers.current.values())[0] : null;
    if (pointers.current.size === 0) setIsDragging(false);
  }, []);

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
        <Button variant="outline" size="icon" aria-label="Zoom in" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(1.3)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Zoom out" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(1 / 1.3)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Fit map to view" className="h-8 w-8 bg-card shadow-soft" onClick={resetView}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        {highlightRoomId && (
          <Button variant="outline" size="icon" aria-label="Focus selected room" className="h-8 w-8 bg-card shadow-soft" onClick={() => {
            const room = plan.rooms.find(r => r.id === highlightRoomId);
            if (room && containerRef.current) {
              const { clientWidth: cw, clientHeight: ch } = containerRef.current;
              const targetScale = 2;
              setView(boundedView({ scale: targetScale, x: cw / 2 - (room.x + room.w / 2) * targetScale, y: ch / 2 - (room.y + room.h / 2) * targetScale }, cw, ch, plan.svgWidth, plan.svgHeight));
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
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation();
            dragged.current = false;
          }
        }}
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
          <g
            transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}
            style={{ transition: isDragging ? "none" : "transform 180ms ease-out" }}
          >
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

            {/* Route line */}
            {routeLine && (
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
          </g>
        </svg>
      </div>
    </div>
  );
}
