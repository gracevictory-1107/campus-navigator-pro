import { useMemo, useState } from "react";
import { MapPinned, Radio } from "lucide-react";
import { allFloorPlans } from "@/data/floorPlans";
import FloorPlanSVG, { type PersonMarker } from "@/components/FloorPlanSVG";
import { usePersonMarkers } from "@/hooks/useBackendData";
import { StatusDot, VisitorTypeBadge, formatTime } from "./common";
import { Button } from "@/components/ui/button";

/**
 * Live security map: plots each visitor's last CCTV-detected position on the
 * existing campus floor plans. Colour is ACCESS STATUS ONLY — green = authorized,
 * red = restricted. It reuses FloorPlanSVG's bounded zoom/pan viewport and never
 * mutates room or route geometry.
 */
export default function SecurityMap() {
  const markers = usePersonMarkers();
  const [floorOverride, setFloorOverride] = useState<string | null>(null);

  // Floors that currently have at least one detected person.
  const floorsWithPeople = useMemo(() => {
    const set = new Set<string>();
    for (const m of markers) if (m.floorPlanId && allFloorPlans[m.floorPlanId]) set.add(m.floorPlanId);
    return [...set];
  }, [markers]);

  const activeFloor = floorOverride && allFloorPlans[floorOverride]
    ? floorOverride
    : floorsWithPeople[0] ?? null;

  const plan = activeFloor ? allFloorPlans[activeFloor] : null;

  const floorMarkers: PersonMarker[] = useMemo(() => {
    if (!activeFloor) return [];
    return markers
      .filter((m) => m.floorPlanId === activeFloor && m.roomId)
      .map((m) => ({
        roomId: m.roomId as string,
        color: m.color,
        label: m.name.slice(0, 2).toUpperCase(),
        title: `${m.name}${m.visitorType ? ` (${m.visitorType})` : ""} — ${m.locationName ?? "unknown"} · ${m.color === "red" ? "RESTRICTED" : "authorized"}`,
      }));
  }, [markers, activeFloor]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-2.5 py-2">
        <Radio className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Live positions from simulated CCTV detections. <b className="text-emerald-600 dark:text-emerald-400">Green</b> = authorized,
          {" "}<b className="text-red-600 dark:text-red-400">red</b> = restricted violation. Colour never reflects visitor type.
        </span>
      </div>

      {floorsWithPeople.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {floorsWithPeople.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={f === activeFloor ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFloorOverride(f)}
            >
              <MapPinned className="h-3.5 w-3.5 mr-1" />
              {allFloorPlans[f]?.title ?? f}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl border border-border overflow-hidden bg-card min-h-[320px]">
          {plan ? (
            <FloorPlanSVG plan={plan} markers={floorMarkers} />
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
              <MapPinned className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No live detections yet.</p>
              <p className="text-xs mt-1">Run a CCTV detection to place a visitor on the map.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-2 max-h-[360px] overflow-y-auto">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tracked people ({markers.length})
          </h4>
          {markers.length === 0 && (
            <p className="text-xs text-muted-foreground">No detections recorded.</p>
          )}
          {markers.map((m) => (
            <div
              key={m.personKey}
              className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2"
            >
              <StatusDot color={m.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                  <VisitorTypeBadge type={m.visitorType} />
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {m.locationName ?? "Unknown location"} · {formatTime(m.detectedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
