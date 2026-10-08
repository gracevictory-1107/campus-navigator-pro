import { Activity } from "lucide-react";
import { useLocationEvents } from "@/hooks/useBackendData";
import { StatusDot, formatTime } from "./common";

/** Recent CCTV detections across all people (newest first). */
export default function DetectionActivity({ limit = 8 }: { limit?: number }) {
  const { data: events, loading } = useLocationEvents();

  if (loading) return <p className="text-sm text-muted-foreground">Loading activity…</p>;

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Activity className="h-7 w-7 mx-auto opacity-20 mb-2" />
        <p className="text-sm">No CCTV detections yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {events.slice(0, limit).map((e) => {
        const color = e.access_status === "restricted" ? "red" : "green";
        return (
          <li key={e.id} className="flex items-center gap-3 text-sm">
            <StatusDot color={color} />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate">
                <span className="font-medium">{e.visitor_name ?? e.visitor_code ?? "Unknown"}</span>
                <span className="text-muted-foreground"> detected at </span>
                <span className="font-medium">{e.location_name ?? "—"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {e.camera_identifier ?? "—"} · via {e.detection_method.toUpperCase()}
                {e.confidence != null && <> · {Math.round(e.confidence * 100)}%</>} · {formatTime(e.detected_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
