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

export default function FloorPlanSVG({ plan, highlightRoomId, onRoomClick, categoryFilter, routeFromId, routeToId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  useEffect(() => { resetView(); }, [plan.id]);

  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const padding = 40;
    const fitScale = Math.min((cw - padding * 2) / plan.svgWidth, (ch - padding * 2) / plan.svgHeight, 1.5);
    setScale(fitScale);
    setTranslate({ x: (cw - plan.svgWidth * fitScale) / 2, y: (ch - plan.svgHeight * fitScale) / 2 });
  }, [plan.svgWidth, plan.svgHeight]);

  useEffect(() => {
    resetView();
    const ro = new ResizeObserver(resetView);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resetView]);

  // Auto-zoom to highlighted room
  useEffect(() => {
    if (!highlightRoomId || !containerRef.current) return;
    const room = plan.rooms.find((r) => r.id === highlightRoomId);
    if (!room) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const targetScale = Math.min(2.5, Math.max(scale, 1.5));
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    setScale(targetScale);
    setTranslate({ x: cw / 2 - cx * targetScale, y: ch / 2 - cy * targetScale });
  }, [highlightRoomId]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(4, scale * delta));
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTranslate({ x: mx - (mx - translate.x) * (newScale / scale), y: my - (my - translate.y) * (newScale / scale) });
    setScale(newScale);
  }, [scale, translate]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const zoom = (factor: number) => {
    const newScale = Math.max(0.3, Math.min(4, scale * factor));
    const c = containerRef.current!;
    const cx = c.clientWidth / 2, cy = c.clientHeight / 2;
    setTranslate({ x: cx - (cx - translate.x) * (newScale / scale), y: cy - (cy - translate.y) * (newScale / scale) });
    setScale(newScale);
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
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(1.3)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => zoom(0.7)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={resetView}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        {highlightRoomId && (
          <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-soft" onClick={() => {
            const room = plan.rooms.find(r => r.id === highlightRoomId);
            if (room && containerRef.current) {
              const { clientWidth: cw, clientHeight: ch } = containerRef.current;
              const targetScale = 2;
              setScale(targetScale);
              setTranslate({ x: cw / 2 - (room.x + room.w / 2) * targetScale, y: ch / 2 - (room.y + room.h / 2) * targetScale });
            }
          }}>
            <LocateFixed className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Zoom level */}
      <div className="absolute bottom-3 left-3 z-10 text-xs text-muted-foreground bg-card/90 px-2 py-1 rounded-md shadow-soft">
        {Math.round(scale * 100)}%
      </div>

      {/* Legend */}
      <RoomLegend />

      {/* SVG */}
      <div
        ref={containerRef}
        className={`h-full w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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
          <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
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
