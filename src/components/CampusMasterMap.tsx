import type { FloorPlan, Room } from "@/data/floorPlans";
import { allFloorPlans } from "@/data/floorPlans";
import { ArrowDown, Building2, Link2, MapPinned, Trees } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  activeFloor: string;
  onSelectFloor: (id: string) => void;
  onOpenFloorExplorer: () => void;
}

const roomFillVar: Record<string, string> = {
  lab: "hsl(var(--room-lab))", class: "hsl(var(--room-class))", hod: "hsl(var(--room-hod))",
  stairs: "hsl(var(--room-stairs))", lift: "hsl(var(--room-lift))", wc: "hsl(var(--room-wc))",
  exit: "hsl(var(--room-exit))", corridor: "hsl(var(--room-corridor))", staff: "hsl(var(--room-staff))",
  innov: "hsl(var(--room-innov))", open: "hsl(var(--room-open))", canteen: "hsl(var(--room-canteen))",
  dean: "hsl(var(--room-dean))", court: "hsl(var(--room-court))",
};

const roomStrokeVar: Record<string, string> = {
  lab: "hsl(var(--room-lab-stroke))", class: "hsl(var(--room-class-stroke))", hod: "hsl(var(--room-hod-stroke))",
  stairs: "hsl(var(--room-stairs-stroke))", lift: "hsl(var(--room-lift-stroke))", wc: "hsl(var(--room-wc-stroke))",
  exit: "hsl(var(--room-exit-stroke))", corridor: "hsl(var(--room-corridor-stroke))", staff: "hsl(var(--room-staff-stroke))",
  innov: "hsl(var(--room-innov-stroke))", open: "hsl(var(--room-open-stroke))", canteen: "hsl(var(--room-canteen-stroke))",
  dean: "hsl(var(--room-dean-stroke))", court: "hsl(var(--room-court-stroke))",
};

const groups = [
  { id: "main", title: "Main Building", subtitle: "Ground Floor + 5 upper floors", icon: Building2, floors: ["mb-gf", "mb-f1", "mb-f2", "mb-f3", "mb-f4", "mb-f5"] },
  { id: "fisheries", title: "Fisheries Block", subtitle: "Ground Floor + 2 upper floors", icon: Building2, floors: ["fb-gf", "fb-f1", "fb-f2"] },
  { id: "bblock", title: "B Block", subtitle: "Floors 3, 4 and 5", icon: Building2, floors: ["bb-f3", "bb-f4", "bb-f5"] },
  { id: "sheds", title: "Sheds & Open Areas", subtitle: "Ground-level activity zone", icon: Trees, floors: ["sheds"] },
] as const;

function floorLabel(plan: FloorPlan) {
  return plan.label || plan.title;
}

function roomCount(plan: FloorPlan) {
  return plan.rooms.filter((room) => room.type !== "corridor" && room.label).length;
}

function showRoomLabel(room: Room) {
  return Boolean(room.label) && room.type !== "corridor" && room.w >= 55 && room.h >= 36;
}

function FloorThumbnail({
  plan,
  active,
  onClick,
}: {
  plan: FloorPlan;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border text-left p-2.5 transition-all duration-200 bg-card/90 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-elevated",
        active ? "border-primary/50 ring-2 ring-primary/15 shadow-card" : "border-border hover:border-primary/30"
      )}
      aria-label={"Open " + floorLabel(plan)}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate">{floorLabel(plan)}</p>
          <p className="text-[9px] text-muted-foreground truncate">{plan.subtitle}</p>
        </div>
        <span className={cn("shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold tracking-wide", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          {plan.code}
        </span>
      </div>

      <div className="rounded-xl border border-border/70 bg-secondary/25 p-1.5">
        <svg viewBox={"0 0 " + plan.svgWidth + " " + plan.svgHeight} className="block h-28 w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <rect x="0" y="0" width={plan.svgWidth} height={plan.svgHeight} rx="8" fill="hsl(var(--card))" />
          {plan.rooms.map((room) => (
            <g key={room.id}>
              <rect x={room.x} y={room.y} width={room.w} height={room.h} rx="4" fill={roomFillVar[room.type] || "hsl(var(--secondary))"} stroke={roomStrokeVar[room.type] || "hsl(var(--border))"} strokeWidth={room.type === "corridor" ? 0.8 : 1} />
              {showRoomLabel(room) && (
                <text x={room.x + room.w / 2} y={room.y + room.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="600" fill="hsl(var(--foreground))" opacity="0.72" pointerEvents="none">
                  {room.label}
                </text>
              )}
            </g>
          ))}
          {plan.labels?.slice(0, 8).map((label, index) => (
            <text key={"label-" + index} x={label.x} y={label.y} textAnchor={label.anchor || "start"} fontSize="7" fontWeight="700" fill="hsl(var(--primary))" opacity="0.82" pointerEvents="none">
              {label.text}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between px-1 pt-2">
        <span className="text-[9px] text-muted-foreground">{roomCount(plan)} mapped spaces</span>
        <span className="text-[9px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Open floor →</span>
      </div>
    </button>
  );
}

export default function CampusMasterMap({ activeFloor, onSelectFloor, onOpenFloorExplorer }: Props) {
  const campus = allFloorPlans.campus;

  const handleFloorSelect = (id: string) => {
    onSelectFloor(id);
    onOpenFloorExplorer();
  };

  return (
    <div className="h-full overflow-auto px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto max-w-[1500px]">
        <section className="campus-master-hero rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-4 sm:p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MapPinned className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">Campus network</p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">Every layout, connected in one view</h2>
                </div>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Start from the complete campus map, then open any building or floor for the detailed interactive navigator.
              </p>
            </div>

            <button type="button" onClick={onOpenFloorExplorer} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15">
              Explore floors
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-secondary/20">
            <div className="border-b border-border/60 bg-card/65 px-3 py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Campus overview</p>
                <p className="text-xs font-semibold text-foreground">{campus.title}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold text-primary">{campus.code}</span>
            </div>
            <div className="p-2.5 sm:p-3">
              <button type="button" onClick={() => handleFloorSelect("campus")} className="block w-full rounded-xl border border-border/70 bg-card p-1.5 transition hover:border-primary/30 hover:shadow-soft" aria-label="Open campus overview">
                <svg viewBox={"0 0 " + campus.svgWidth + " " + campus.svgHeight} className="block h-44 sm:h-56 lg:h-64 w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <rect x="0" y="0" width={campus.svgWidth} height={campus.svgHeight} rx="10" fill="hsl(var(--card))" />
                  {campus.rooms.map((room) => (
                    <rect key={room.id} x={room.x} y={room.y} width={room.w} height={room.h} rx="5" fill={roomFillVar[room.type] || "hsl(var(--secondary))"} stroke={roomStrokeVar[room.type] || "hsl(var(--border))"} strokeWidth={room.type === "corridor" ? 0.8 : 1} />
                  ))}
                  {campus.labels?.map((label, index) => (
                    <text key={"campus-label-" + index} x={label.x} y={label.y} textAnchor={label.anchor || "start"} fontSize="9" fontWeight="700" fill="hsl(var(--primary))" opacity="0.85">
                      {label.text}
                    </text>
                  ))}
                </svg>
              </button>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.id} className="campus-floor-stack rounded-3xl border border-border bg-card/55 backdrop-blur-sm p-3.5 shadow-soft">
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <GroupIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-foreground">{group.title}</h3>
                    <p className="text-[9px] text-muted-foreground">{group.subtitle}</p>
                  </div>
                  <Link2 className="ml-auto h-4 w-4 text-primary/45" />
                </div>

                <div className="space-y-1.5">
                  {group.floors.map((floorId, index) => {
                    const plan = allFloorPlans[floorId];
                    if (!plan) return null;
                    return (
                      <div key={floorId}>
                        <FloorThumbnail plan={plan} active={activeFloor === floorId} onClick={() => handleFloorSelect(floorId)} />
                        {index < group.floors.length - 1 && (
                          <div className="flex justify-center py-1 text-primary/35" aria-hidden="true">
                            <ArrowDown className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.045] px-4 py-3 text-[10px] sm:text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> select any floor card to jump directly into its interactive map, search rooms, check access, and start directions.
        </div>
      </div>
    </div>
  );
}
