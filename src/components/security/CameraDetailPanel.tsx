import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Camera as CameraIcon, VideoOff, Radio, Activity, MapPin, Loader2 } from "lucide-react";
import { cameras as camerasApi, type ApiCamera, type ApiLocationEvent, type CameraStatus, type IntegrationType } from "@/lib/api";
import { allFloorPlans } from "@/data/floorPlans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, formatTime } from "./common";

interface Props {
  camera: ApiCamera;
  lastEvent?: ApiLocationEvent | null;
  onClose: () => void;
}

/**
 * Detailed view for a single CCTV camera. Fetches live status + stream
 * descriptor from the backend (GET /cameras/:id/status, /cameras/:id/stream).
 * The stream is a SIMULATED placeholder — no real camera hardware, NVR/VMS or
 * ONVIF device is connected and no credentials are ever requested or stored.
 */
export default function CameraDetailPanel({ camera, lastEvent, onClose }: Props) {
  const [status, setStatus] = useState<{ status: CameraStatus; integrationType: IntegrationType; live: boolean } | null>(null);
  const [stream, setStream] = useState<{ type: string; placeholder: boolean; streamUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      camerasApi.status(camera.id).catch(() => null),
      camerasApi.stream(camera.id).catch(() => null),
    ]).then(([s, st]) => {
      if (!active) return;
      setStatus(s);
      setStream(st);
      setLoading(false);
    });
    return () => { active = false; };
  }, [camera.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const online = (status?.live ?? camera.status === "online");
  const floorName = camera.floor_plan_id
    ? (allFloorPlans[camera.floor_plan_id]?.title ?? camera.floor_plan_id)
    : "—";
  const roomName = camera.room_id && camera.floor_plan_id
    ? (allFloorPlans[camera.floor_plan_id]?.rooms.find((r) => r.id === camera.room_id)?.label ?? camera.room_id)
    : (camera.room_id ?? "—");

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.22 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-l border-border shadow-elevated z-50 flex flex-col"
        role="dialog"
        aria-label={`${camera.camera_name} camera detail`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CameraIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground truncate">{camera.camera_name}</h3>
              <code className="font-mono text-[11px] text-muted-foreground">{camera.camera_identifier}</code>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClose} title="Close camera panel" aria-label="Close camera panel">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-neutral-950 flex items-center justify-center">
            {online ? (
              <>
                <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.15)_3px)]" />
                <CameraIcon className="h-10 w-10 text-neutral-600" />
                <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-neutral-500">
                <VideoOff className="h-9 w-9" />
                <span className="text-[11px] uppercase">{camera.status}</span>
              </div>
            )}
            <span className="absolute bottom-2 right-2 text-[9px] text-neutral-500 font-mono">
              SIMULATED · NO SIGNAL · placeholder
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={online ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-neutral-400 text-muted-foreground"}>
              <Radio className="h-3 w-3 mr-1" /> {online ? "Online" : camera.status}
            </Badge>
            <Badge variant="secondary" className="capitalize">{camera.integration_type}</Badge>
            {lastEvent?.access_status && <StatusBadge color={lastEvent.access_status === "restricted" ? "red" : "green"} />}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div><dt className="text-muted-foreground">Physical location</dt><dd className="font-medium text-foreground">{camera.location_name ?? camera.camera_location ?? "Unmapped"}</dd></div>
            <div><dt className="text-muted-foreground">Floor</dt><dd className="font-medium text-foreground">{floorName}</dd></div>
            <div><dt className="text-muted-foreground">Room</dt><dd className="font-medium text-foreground">{roomName}</dd></div>
            <div><dt className="text-muted-foreground">Detection state</dt>
              <dd className="font-medium text-foreground">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (stream?.placeholder ? "Simulated" : (stream?.type ?? "—"))}
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
              <Activity className="h-3.5 w-3.5" /> Last event
            </div>
            {lastEvent ? (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="text-foreground font-medium">{lastEvent.visitor_name ?? lastEvent.visitor_code ?? "Unknown person"}</p>
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lastEvent.location_name ?? "—"} · via {lastEvent.camera_identifier ?? camera.camera_identifier}</p>
                <p>{formatTime(lastEvent.detected_at)}{lastEvent.confidence != null ? ` · ${Math.round(lastEvent.confidence * 100)}%` : ""}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No detections recorded for this camera yet.</p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Prototype feed only. No live camera hardware, NVR/DVR, VMS or ONVIF device is connected, and no
            camera credentials or stream URLs are stored. An authorized college integration can be added later
            via this camera&apos;s provider settings without changing access-control, alert or live-map logic.
          </p>
        </div>
      </motion.div>
    </>
  );
}
