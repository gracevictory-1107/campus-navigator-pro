import { useState } from "react";
import { Video, Loader2, Radio, MapPin, DoorOpen, Layers, Camera as CameraIcon, Clock } from "lucide-react";
import { cctv, type DetectionResult } from "@/lib/api";
import { allFloorPlans } from "@/data/floorPlans";
import { useCameras, useVisitors } from "@/hooks/useBackendData";
import { playAlarm, playBlip } from "@/lib/alarm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, VisitorTypeBadge, formatTime } from "./common";

/**
 * Development CCTV detection simulator. Stands in for the real video-analytics
 * pipeline: pick a camera + a person, and the backend maps the camera to its
 * location, decides access, records the event and raises an alert if restricted.
 *
 * There is NO QR / checkpoint scanning — CCTV is the location source. All access
 * decisions come from the backend; this component never computes authorization.
 */
export default function CctvSimulator() {
  const { data: cameras } = useCameras();
  const { data: visitors } = useVisitors();
  const [cameraId, setCameraId] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const activeVisitors = visitors.filter((v) => v.status === "active");

  const run = async () => {
    if (!cameraId || !visitorId) {
      setError("Select a camera and a visitor to simulate a detection.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await cctv.simulateDetection(cameraId, visitorId);
      setResult(res);
      if (res.color === "red") playAlarm(3);
      else playBlip();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  // Map the detection's floor_plan_id / room_id onto the existing campus plans
  // so the panel can name the floor + room without touching any geometry.
  const floorName = result?.floorPlanId ? (allFloorPlans[result.floorPlanId]?.title ?? result.floorPlanId) : null;
  const roomName = result?.roomId
    ? (result.floorPlanId && allFloorPlans[result.floorPlanId]
        ? allFloorPlans[result.floorPlanId].rooms.find((r) => r.id === result.roomId)?.label ?? result.roomId
        : result.roomId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">CCTV Detection</h3>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-2.5 py-2">
        <Radio className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Simulated video-analytics detection. The camera determines the person's campus
          location and the backend decides access. No QR, no real camera hardware.
        </span>
      </div>

      <div className="space-y-1.5">
        <Label>Camera</Label>
        <Select value={cameraId} onValueChange={setCameraId}>
          <SelectTrigger><SelectValue placeholder="Select camera" /></SelectTrigger>
          <SelectContent>
            {cameras.map((c) => (
              <SelectItem key={c.id} value={c.camera_identifier}>
                {c.camera_identifier} — {c.location_name ?? c.camera_location ?? "Unmapped"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sim-visitor">Detected person</Label>
        <Select value={visitorId} onValueChange={setVisitorId}>
          <SelectTrigger id="sim-visitor"><SelectValue placeholder="Select visitor" /></SelectTrigger>
          <SelectContent>
            {activeVisitors.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No active visitors yet</div>
            )}
            {activeVisitors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.visitor_code} — {v.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <Button className="w-full" onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
        <span className="ml-2">Simulate detection</span>
      </Button>

      {result && (
        <div className={`rounded-xl border p-3 ${result.color === "red" ? "border-red-500/50 bg-red-500/5" : "border-emerald-500/40 bg-emerald-500/5"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{result.visitorName}</span>
              {result.visitorCode && <code className="font-mono text-xs text-muted-foreground">{result.visitorCode}</code>}
              <VisitorTypeBadge type={result.visitorType} />
            </div>
            <StatusBadge color={result.color} />
          </div>

          {/* Current location panel — person / camera / floor / room / status / time */}
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CameraIcon className="h-3.5 w-3.5" /> Camera
              <span className="ml-auto font-mono text-foreground">{result.cameraId}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> Floor
              <span className="ml-auto text-foreground">{floorName ?? "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DoorOpen className="h-3.5 w-3.5" /> Room
              <span className="ml-auto text-foreground">{roomName ?? result.currentLocation ?? "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Location
              <span className="ml-auto text-foreground">{result.currentLocation ?? "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Detected
              <span className="ml-auto text-foreground">{formatTime(result.detectedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Radio className="h-3.5 w-3.5" /> Confidence
              <span className="ml-auto text-foreground">{Math.round(result.confidence * 100)}%</span>
            </div>
          </dl>

          <p className={`text-sm font-semibold mt-2 ${result.color === "red" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            Status: {result.color === "red" ? "🔴 RESTRICTED" : "🟢 AUTHORIZED"}
          </p>
          {result.alertCreated && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
              🚨 High-severity security alert raised.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
