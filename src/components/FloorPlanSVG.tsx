import { useState } from "react";
import type { FloorPlan, Room, RoomType } from "@/data/floorPlans";
import { motion, AnimatePresence } from "framer-motion";

const roomFills: Record<RoomType, string> = {
  lab: "hsl(var(--room-lab))",
  class: "hsl(var(--room-class))",
  hod: "hsl(var(--room-hod))",
  stairs: "hsl(var(--room-stairs))",
  lift: "hsl(var(--room-lift))",
  wc: "hsl(var(--room-wc))",
  exit: "hsl(var(--room-exit))",
  corridor: "hsl(var(--room-corridor))",
  staff: "hsl(var(--room-staff))",
  innov: "hsl(var(--room-innov))",
  open: "hsl(var(--room-open))",
  canteen: "hsl(var(--room-canteen))",
  dean: "hsl(var(--room-dean))",
  court: "hsl(var(--room-court))",
};

const roomStrokes: Record<RoomType, string> = {
  lab: "hsl(var(--room-lab-stroke))",
  class: "hsl(var(--room-class-stroke))",
  hod: "hsl(var(--room-hod-stroke))",
  stairs: "hsl(var(--room-stairs-stroke))",
  lift: "hsl(var(--room-lift-stroke))",
  wc: "hsl(var(--room-wc-stroke))",
  exit: "hsl(var(--room-exit-stroke))",
  corridor: "hsl(var(--room-corridor-stroke))",
  staff: "hsl(var(--room-staff-stroke))",
  innov: "hsl(var(--room-innov-stroke))",
  open: "hsl(var(--room-open-stroke))",
  canteen: "hsl(var(--room-canteen-stroke))",
  dean: "hsl(var(--room-dean-stroke))",
  court: "hsl(var(--room-court-stroke))",
};

function labelColor(type: RoomType): string {
  if (type === "exit") return "hsl(var(--green))";
  if (type === "canteen") return "hsl(var(--amber))";
  if (type === "innov" || type === "dean") return "#c084fc";
  return "#7ab8cc";
}

function labelBoldColor(type: RoomType): string {
  if (type === "exit") return "hsl(var(--green))";
  if (type === "canteen") return "hsl(var(--amber))";
  if (type === "innov" || type === "dean") return "#c084fc";
  return "#c0dce8";
}

interface Props {
  plan: FloorPlan;
  highlightRoomId?: string;
  onCoordUpdate?: (x: number, y: number) => void;
}

export default function FloorPlanSVG({ plan, highlightRoomId, onCoordUpdate }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    onCoordUpdate?.(x, y);
  };

  const isVerticalLabel = (room: Room) => {
    return room.h > room.w * 1.8;
  };

  return (
    <div className="relative">
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-50 pointer-events-none border border-cyan-dim bg-background/95 px-3 py-1.5 text-[10px] tracking-widest text-cyan glow-cyan"
            style={{ left: tooltip.x + 14, top: tooltip.y - 28, fontFamily: "var(--font-mono)" }}
          >
            // {tooltip.text}
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        width={plan.svgWidth}
        height={plan.svgHeight}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Direction labels */}
        {plan.labels?.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor || "start"}
            fill={
              label.color === "green" ? "hsl(var(--green))"
              : label.color === "amber" ? "hsl(var(--amber))"
              : "hsl(var(--cyan))"
            }
            fontSize="9"
            letterSpacing="1"
            fontFamily="var(--font-mono)"
          >
            {label.text}
          </text>
        ))}

        {/* Rooms */}
        {plan.rooms.map((room) => {
          const isHighlighted = highlightRoomId === room.id;
          const vertical = isVerticalLabel(room);
          const cx = room.x + room.w / 2;
          const cy = room.y + room.h / 2;

          return (
            <g
              key={room.id}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={(e) => {
                const desc = room.description || room.label;
                if (desc) setTooltip({ text: desc, x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                if (tooltip) setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect
                x={room.x}
                y={room.y}
                width={room.w}
                height={room.h}
                rx={2}
                fill={roomFills[room.type]}
                stroke={isHighlighted ? "hsl(var(--cyan))" : roomStrokes[room.type]}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                className="transition-all duration-150 hover:brightness-[1.6]"
                style={isHighlighted ? { filter: "brightness(1.8)", strokeWidth: 2.5 } : {}}
              />
              {/* Label */}
              {room.label && (
                <text
                  x={cx}
                  y={room.sublabel ? cy - 6 : cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={room.type === "corridor" ? "hsl(var(--text-dim))" : labelBoldColor(room.type)}
                  fontSize={room.type === "corridor" ? 8 : room.w > 150 && room.h > 100 ? 11 : 8.5}
                  letterSpacing="0.3"
                  fontFamily="var(--font-mono)"
                  pointerEvents="none"
                  transform={vertical ? `rotate(-90,${cx},${cy})` : undefined}
                >
                  {room.label}
                </text>
              )}
              {room.sublabel && (
                <text
                  x={cx}
                  y={cy + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={room.type === "corridor" ? "hsl(var(--text-dim))" : labelColor(room.type)}
                  fontSize={8}
                  letterSpacing="0.3"
                  fontFamily="var(--font-mono)"
                  pointerEvents="none"
                  transform={vertical ? `rotate(-90,${cx},${cy + 10})` : undefined}
                >
                  {room.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
