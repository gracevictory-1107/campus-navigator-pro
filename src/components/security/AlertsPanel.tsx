import { useEffect, useRef, useState } from "react";
import { Siren, BellRing, CheckCheck, Volume2, VolumeX, Video, Eye } from "lucide-react";
import { alerts as alertsApi } from "@/lib/api";
import { useAlerts } from "@/hooks/useBackendData";
import { playAlarm } from "@/lib/alarm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertStatusBadge, SeverityBadge, VisitorTypeBadge, formatTime } from "./common";

/**
 * Security alerts feed. Plays a simulated alarm when a new ACTIVE alert arrives
 * (pushed over SSE). Security/admin can acknowledge / resolve; management is
 * read-only (the backend also rejects their mutations — UI mirrors that).
 */
export default function AlertsPanel({
  limit,
  onViewCamera,
  readOnly = false,
}: {
  limit?: number;
  onViewCamera?: (cameraIdentifier: string) => void;
  readOnly?: boolean;
}) {
  const { data: alerts, loading, reload } = useAlerts();
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const [soundOn, setSoundOn] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    let fired = false;
    for (const a of alerts) {
      if (!seen.current.has(a.id)) {
        seen.current.add(a.id);
        if (primed.current && a.status === "active") fired = true;
      }
    }
    primed.current = true;
    if (fired && soundOn) playAlarm(3);
  }, [alerts, loading, soundOn]);

  const act = async (id: string, action: "acknowledge" | "resolve") => {
    setBusyId(id);
    try {
      if (action === "acknowledge") await alertsApi.acknowledge(id);
      else await alertsApi.resolve(id);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const visible = limit ? alerts.slice(0, limit) : alerts;
  const activeCount = alerts.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Siren className={`h-5 w-5 ${activeCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          <span className="font-display font-semibold text-sm text-foreground">
            Security Alerts {activeCount > 0 && <span className="text-red-500">({activeCount} active)</span>}
          </span>
          {readOnly && (
            <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" /> Read-only
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => {
            setSoundOn((s) => !s);
            if (!soundOn) playAlarm(1);
          }}
          title={soundOn ? "Mute alarm" : "Unmute alarm"}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="text-xs hidden sm:inline">{soundOn ? "Sound on" : "Muted"}</span>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BellRing className="h-8 w-8 mx-auto opacity-20 mb-2" />
          <p className="text-sm">No alerts. Restricted-area detections appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((a) => (
            <li
              key={a.id}
              className={`rounded-lg border p-3 ${a.status === "active" ? "border-red-500/40 bg-red-500/5" : "border-border bg-secondary/30"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                      {a.alert_type === "restricted_access" ? "🔴 Restricted access" : a.alert_type.replace(/_/g, " ")}
                    </span>
                    <VisitorTypeBadge type={a.visitor_type} />
                    <SeverityBadge severity={a.severity} />
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1 truncate">
                    {a.visitor_name ?? "Unknown person"}
                    {a.visitor_code && <code className="ml-2 font-mono text-xs text-muted-foreground">{a.visitor_code}</code>}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📍 {a.location_name ?? "—"} · 📷 {a.camera_identifier ?? "—"} · {formatTime(a.detected_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {a.camera_identifier && onViewCamera && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onViewCamera(a.camera_identifier as string)}>
                    <Video className="h-3.5 w-3.5 mr-1" /> View Camera
                  </Button>
                )}
                {!readOnly && a.status === "active" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyId === a.id} onClick={() => act(a.id, "acknowledge")}>
                    <BellRing className="h-3.5 w-3.5 mr-1" /> Acknowledge
                  </Button>
                )}
                {!readOnly && a.status !== "resolved" && (
                  <Button size="sm" className="h-7 text-xs" disabled={busyId === a.id} onClick={() => act(a.id, "resolve")}>
                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
