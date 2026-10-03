import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cameras, defaultRules, locationById, seedVisitors } from "./data";
import { accessService } from "./services";
import { playAlertChime } from "./sound";
import type { AccessRule, AlertStatus, LocationEvent, Role, SecurityAlert, Visitor, VisitorStatus } from "./types";

interface State {
  visitors: Visitor[];
  rules: AccessRule[];
  events: LocationEvent[];
  alerts: SecurityAlert[];
  muted: boolean;
}

interface Ctx extends State {
  role: Role;
  setRole: (r: Role) => void;
  highlightedCameraId: string | null;
  setHighlightedCameraId: (id: string | null) => void;
  registerVisitor: (v: Omit<Visitor, "id" | "checkIn" | "status" | "verified" | "returning">, existing?: Visitor) => Visitor;
  setVisitorStatus: (id: string, status: VisitorStatus) => void;
  simulateDetection: (cameraId: string, visitorId: string) => Promise<LocationEvent | null>;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  setRule: (id: string, allowed: boolean) => void;
  setMuted: (m: boolean) => void;
  /** Latest event per person — the current-location layer. */
  currentLocations: LocationEvent[];
}

const SecurityCtx = createContext<Ctx | null>(null);
const STORE_KEY = "campus-security-v1";
const ROLE_KEY = "campus-role";

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { visitors: seedVisitors, rules: defaultRules, events: [], alerts: [], muted: false };
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem(ROLE_KEY) as Role) || "security");
  const [highlightedCameraId, setHighlightedCameraId] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }, [state]);
  const setRole = useCallback((r: Role) => { localStorage.setItem(ROLE_KEY, r); setRoleState(r); }, []);

  const registerVisitor: Ctx["registerVisitor"] = useCallback((input, existing) => {
    const nextNum = 1020 + stateRef.current.visitors.length + Math.floor(Math.random() * 10);
    const visitor: Visitor = {
      ...input,
      id: existing?.id ?? `VIS-${nextNum}`,
      checkIn: Date.now(),
      status: "Active",
      verified: true,
      returning: !!existing,
    };
    setState((s) => ({ ...s, visitors: [visitor, ...s.visitors.filter((v) => v.id !== visitor.id)] }));
    return visitor;
  }, []);

  const setVisitorStatus = useCallback((id: string, status: VisitorStatus) => {
    setState((s) => ({ ...s, visitors: s.visitors.map((v) => (v.id === id ? { ...v, status } : v)) }));
  }, []);

  const simulateDetection = useCallback(async (cameraId: string, visitorId: string) => {
    const s = stateRef.current;
    const cam = cameras.find((c) => c.id === cameraId);
    const visitor = s.visitors.find((v) => v.id === visitorId);
    const loc = cam && locationById(cam.locationId);
    if (!cam || !visitor || !loc) return null;
    const access = await accessService.check(visitor, loc.id, s.rules);
    const event: LocationEvent = {
      id: crypto.randomUUID(), personId: visitor.id, personName: visitor.name, personType: visitor.type,
      cameraId, locationId: loc.id, building: loc.building, floorId: loc.floorId, roomId: loc.roomId, access, at: Date.now(),
    };
    let newAlert: SecurityAlert | null = null;
    if (access === "restricted") {
      const duplicate = s.alerts.some((a) => a.status !== "Resolved" && a.event.personId === visitor.id && a.event.locationId === loc.id);
      if (!duplicate) {
        newAlert = { id: `ALT-${Date.now().toString().slice(-5)}`, event, severity: "HIGH", status: "Active", history: [{ status: "Active", at: event.at, by: "security" }] };
      }
      setHighlightedCameraId(cameraId);
    }
    setState((prev) => ({ ...prev, events: [event, ...prev.events].slice(0, 200), alerts: newAlert ? [newAlert, ...prev.alerts] : prev.alerts }));
    if (newAlert) {
      if (!s.muted) playAlertChime();
      toast.error(`Restricted access: ${visitor.name}`, { description: `${loc.name} · ${cameraId}` });
    }
    return event;
  }, []);

  const setAlertStatus = useCallback((id: string, status: AlertStatus) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, status, history: [...a.history, { status, at: Date.now(), by: role }] } : a)),
    }));
  }, [role]);

  const setRule = useCallback((id: string, allowed: boolean) => {
    setState((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, allowed } : r)) }));
  }, []);

  const setMuted = useCallback((muted: boolean) => setState((s) => ({ ...s, muted })), []);

  const currentLocations = useMemo(() => {
    const seen = new Set<string>();
    return state.events.filter((e) => {
      if (seen.has(e.personId)) return false;
      seen.add(e.personId);
      const v = state.visitors.find((x) => x.id === e.personId);
      return v?.status !== "Checked Out";
    });
  }, [state.events, state.visitors]);

  const value: Ctx = {
    ...state, role, setRole, highlightedCameraId, setHighlightedCameraId, registerVisitor, setVisitorStatus,
    simulateDetection, setAlertStatus, setRule, setMuted, currentLocations,
  };
  return <SecurityCtx.Provider value={value}>{children}</SecurityCtx.Provider>;
}

export function useSecurity() {
  const c = useContext(SecurityCtx);
  if (!c) throw new Error("useSecurity must be used inside SecurityProvider");
  return c;
}

export const formatTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
