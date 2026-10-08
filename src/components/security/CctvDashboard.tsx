import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, VideoOff, AlertTriangle, Info, Clock } from "lucide-react";
import { useCameras, useAlerts, useLocationEvents } from "@/hooks/useBackendData";
import { allFloorPlans } from "@/data/floorPlans";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, formatTime } from "./common";
import CameraDetailPanel from "./CameraDetailPanel";
import type { ApiCamera, ApiLocationEvent } from "@/lib/api";

/**
 * SIMULATED CCTV monitoring dashboard. No real cameras, NVR/DVR/VMS or ONVIF
 * device is connected - cards show a live-feed placeholder. Clicking a camera
 * opens CameraDetailPanel (with X close). Colour on a card reflects ACCESS
 * STATUS only (green = authorized, red = restricted), never visitor type.
 */
export default function CctvDashboard({ focusCamera }: { focusCamera?: string | null }) {
  const { data: cameras, loading } = useCameras();
  const { data: alerts } = useAlerts();
  const { data: events } = useLocationEvents();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selected, setSelected] = useState<ApiCamera | null>(null);

  const alertedCameras = useMemo(
    () => new Set(alerts.filter((a) => a.status === "active" && a.camera_identifier).map((a) => a.camera_identifier as string)),
    [alerts]
  );

  // Latest location event per camera_identifier (CCTV is the only location source).
  const lastEventByCamera = useMemo(() => {
    const map = new Map<string, ApiLocationEvent>();
    for (const e of events) {
      const key = e.camera_identifier;
      if (!key) continue;
      const existing = map.get(key);
      if (!existing || new Date(e.detected_at) >= new Date(existing.detected_at)) map.set(key, e);
    }
    return map;
  }, [events]);

  // Card refs are empty until the camera list resolves, so re-run once it arrives.
  useEffect(() => {
    if (focusCamera && refs.current[focusCamera]) {
      refs.current[focusCamera]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusCamera, cameras]);

  // Keep an open panel in sync when the camera list refreshes over SSE.
  useEffect(() => {
    if (!selected) return;
    const fresh = cameras.find((c) => c.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
    else if (!fresh && cameras.length) setSelected(null);
  }, [cameras]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p className="text-sm text-muted-foreground">Loading cameras…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CameraIcon className="h-5 w-5 text-primary" />
        <span className="font-display font-semibold text-sm text-foreground">CCTV Cameras</span>
        <Badge variant="outline" className="text-[10px] ml-auto">Simulated feed</Badge>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-2.5 py-2">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Prototype only - no live camera hardware is connected. A college NVR/DVR/VMS or
          ONVIF-compatible device can be integrated later via each camera provider settings.
          Click any camera for detail.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cameras.map((cam) => {
          const online = cam.status === "online";
          const hasAlert = alertedCameras.has(cam.camera_identifier);
          const focused = focusCamera === cam.camera_identifier;
          const lastEvent = lastEventByCamera.get(cam.camera_identifier) ?? null;
          const floorName = cam.floor_plan_id ? (allFloorPlans[cam.floor_plan_id]?.title ?? cam.floor_plan_id) : "—";
          return (
            <div
              key={cam.id}
              ref={(el) => { refs.current[cam.camera_identifier] = el; }}
              onClick={() => setSelected(cam)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(cam); } }}
              className={`rounded-xl border overflow-hidden transition-all cursor-pointer hover:border-primary/60 ${
                hasAlert ? "border-red-500 ring-2 ring-red-500/40" : focused ? "border-primary ring-2 ring-primary/50" : "border-border"
              }`}
            >
              <div className="relative aspect-video bg-neutral-900 flex items-center justify-center">
                {online ? (
                  <>
                    <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.15)_3px)]" />
                    <CameraIcon className="h-8 w-8 text-neutral-500" />
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                    </span>
                    <span className="absolute bottom-2 right-2 text-[9px] text-neutral-500 font-mono">
                      {cam.camera_identifier} · NO SIGNAL · placeholder
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-neutral-500">
                    <VideoOff className="h-7 w-7" />
                    <span className="text-[10px] uppercase">{cam.status}</span>
                  </div>
                )}
                {hasAlert && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-red-300 bg-red-950/70 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="h-3 w-3" /> ALERT
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-card">
                <p className="text-sm font-medium text-foreground truncate">{cam.camera_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {cam.location_name ?? cam.camera_location ?? "Unmapped"} · <code className="font-mono">{cam.camera_identifier}</code>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">Floor: {floorName}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={online ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-neutral-400 text-muted-foreground"}>
                    {online ? "Online" : cam.status}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">{cam.integration_type}</Badge>
                  {lastEvent?.access_status
                    ? <StatusBadge color={lastEvent.access_status === "restricted" ? "red" : "green"} />
                    : <Badge variant="outline" className="text-[10px] border-neutral-400 text-muted-foreground">No detection</Badge>}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  {lastEvent
                    ? <span className="truncate">Last: {lastEvent.visitor_name ?? lastEvent.visitor_code ?? "person"} · {formatTime(lastEvent.detected_at)}</span>
                    : <span>No events yet</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <CameraDetailPanel
            camera={selected}
            lastEvent={lastEventByCamera.get(selected.camera_identifier) ?? null}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
