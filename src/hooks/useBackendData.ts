import { useCallback, useEffect, useRef, useState } from "react";
import {
  accessRules,
  alerts as alertsApi,
  cameras as camerasApi,
  locationEvents,
  locations as locationsApi,
  subscribeRealtime,
  visitors as visitorsApi,
  users as usersApi,
  type ApiAccessRule,
  type ApiAlert,
  type ApiCamera,
  type ApiLocation,
  type ApiLocationEvent,
  type ApiVisitor,
  type ApiUser,
  type DetectionResult,
} from "@/lib/api";

interface State<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads a collection from the backend API and keeps it fresh via the SSE
 * realtime stream (reloads whenever an alert/detection event arrives).
 */
function useCollection<T>(loader: () => Promise<T[]>, deps: unknown[] = []): State<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    const run = () =>
      loader()
        .then((rows) => active && (setData(rows), setError(null)))
        .catch((e: Error) => active && setError(e.message))
        .finally(() => active && setLoading(false));
    run();
    const unsub = subscribeRealtime(() => {
      loader().then((rows) => active && setData(rows)).catch(() => {});
    });
    return () => {
      active = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, reload };
}

export const useVisitors = () => useCollection<ApiVisitor>(() => visitorsApi.list());
export const useUsers = () => useCollection<ApiUser>(() => usersApi.list());
export const useAlerts = () => useCollection<ApiAlert>(() => alertsApi.list());
export const useLocations = () => useCollection<ApiLocation>(() => locationsApi.list());
export const useAccessRules = () => useCollection<ApiAccessRule>(() => accessRules.list());
export const useCameras = () => useCollection<ApiCamera>(() => camerasApi.list());
export const useLocationEvents = () => useCollection<ApiLocationEvent>(() => locationEvents.list());

/**
 * A rolling feed of live CCTV detections pushed over SSE, newest first.
 * Used for the detection activity list and the security map markers.
 */
export function useDetectionFeed(max = 100) {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const unsub = subscribeRealtime((evt) => {
      if (evt.type !== "detection") return;
      setDetections((prev) => [evt.data, ...prev].slice(0, max));
    });
    return () => {
      mounted.current = false;
      unsub();
    };
  }, [max]);
  return detections;
}

/**
 * Latest known position per person (visitor), derived from location events.
 * Colour reflects access status only: green = authorized, red = restricted.
 */
export function usePersonMarkers() {
  const { data: events } = useLocationEvents();
  const latest = new Map<string, ApiLocationEvent>();
  for (const e of events) {
    const key = e.visitor_id ?? e.person_id ?? "";
    if (!key) continue;
    const existing = latest.get(key);
    if (!existing || new Date(e.detected_at) >= new Date(existing.detected_at)) latest.set(key, e);
  }
  return [...latest.values()].map((e) => ({
    id: e.id,
    personKey: (e.visitor_id ?? e.person_id) as string,
    name: e.visitor_name ?? e.visitor_code ?? "Unknown",
    visitorType: e.visitor_type ?? null,
    floorPlanId: e.floor_plan_id ?? null,
    roomId: e.room_id ?? null,
    locationName: e.location_name ?? null,
    color: (e.access_status === "restricted" ? "red" : "green") as "green" | "red",
    detectedAt: e.detected_at,
  }));
}
