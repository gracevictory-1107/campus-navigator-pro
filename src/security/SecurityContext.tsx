import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cameras, defaultRules, locationById, seedVisitors, securityLocations } from "./data";
import { can } from "./permissions";
import { accessService } from "./services";
import { evaluateIndoorRouteAccess } from "./routeAccess";
import { playAlertChime } from "./sound";
import { allFloorPlans } from "@/data/floorPlans";
import type { IndoorRoute } from "@/lib/indoorRouting";
import { getAuthenticatedRole, loadSecuritySnapshot, persistSecuritySnapshot, supabase } from "@/lib/supabase";
import { personTypes, type AccessRule, type AlertSeverity, type AlertStatus, type LocationEvent, type PersonType, type Role, type SecurityAlert, type Visitor, type VisitorStatus } from "./types";
import type { RouteAccessDecision } from "./routeAccess";

interface State {
  visitors: Visitor[];
  rules: AccessRule[];
  events: LocationEvent[];
  alerts: SecurityAlert[];
  muted: boolean;
}

interface Ctx extends State {
  role: Role;
  signedIn: boolean;
  setRole: (r: Role) => void;
  signOut: () => void;
  highlightedCameraId: string | null;
  setHighlightedCameraId: (id: string | null) => void;
  registerVisitor: (v: Omit<Visitor, "id" | "checkIn" | "status" | "verified" | "returning">, existing?: Visitor) => Visitor;
  setVisitorStatus: (id: string, status: VisitorStatus) => void;
  simulateDetection: (cameraId: string, visitorId: string) => Promise<LocationEvent | null>;
  authorizeIndoorRoute: (visitorId: string, route: IndoorRoute) => Promise<RouteAccessDecision>;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  setRule: (id: string, allowed: boolean) => void;
  setMuted: (m: boolean) => void;
  /** Latest event per person — the current-location layer. */
  currentLocations: LocationEvent[];
}

const SecurityCtx = createContext<Ctx | null>(null);
const STORE_KEY = "campus-security-v1";
const ROLE_KEY = "campus-role";

function normalizePersonType(value: unknown): PersonType {
  if (value === "Visitor") return "General Visitor";
  if (personTypes.some((type) => type === value)) return value as PersonType;
  throw new Error(`Unsupported stored visitor category: ${String(value)}`);
}

function normalizeAlertSeverity(value: unknown): AlertSeverity {
  if (value === "HIGH") return "High";
  if (value === "CRITICAL") return "Critical";
  if (value === "MEDIUM") return "Medium";
  if (value === "LOW") return "Low";
  if (value === "Critical" || value === "High" || value === "Medium" || value === "Low") return value;
  return "High";
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as State;
      const rulesById = new Map(defaultRules.map((rule) => [rule.id, rule]));
      stored.rules.forEach((rule) => {
        const personType = normalizePersonType(rule.personType);
        const migrated = { ...rule, personType, id: `${personType}:${rule.locationId}` };
        rulesById.set(migrated.id, migrated);
      });
      return {
        ...stored,
        visitors: stored.visitors.map((visitor) => ({ ...visitor, type: normalizePersonType(visitor.type) })),
        rules: [...rulesById.values()],
        events: stored.events.map((event) => ({ ...event, personType: normalizePersonType(event.personType) })),
        alerts: stored.alerts.map((alert) => ({
          ...alert,
          severity: normalizeAlertSeverity(alert.severity),
          event: { ...alert.event, personType: normalizePersonType(alert.event.personType) },
        })),
      };
    }
  } catch { /* ignore */ }
  return { visitors: seedVisitors, rules: defaultRules, events: [], alerts: [], muted: false };
}

function mergeRecords<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const merged = new Map(local.map((record) => [record.id, record]));
  remote.forEach((record) => merged.set(record.id, record));
  return [...merged.values()];
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem(ROLE_KEY) as Role) || "student");
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem(ROLE_KEY) !== null);
  const [highlightedCameraId, setHighlightedCameraId] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const synchronizeSession = async () => {
      try {
        const authenticatedRole = await getAuthenticatedRole();
        if (!active) return;
        if (!authenticatedRole) {
          localStorage.removeItem(ROLE_KEY);
          setRoleState("student");
          setSignedIn(false);
          setBackendReady(false);
          return;
        }
        localStorage.setItem(ROLE_KEY, authenticatedRole);
        setRoleState(authenticatedRole);
        setSignedIn(true);
        const remote = await loadSecuritySnapshot();
        if (!active || !remote) return;
        setState((local) => ({
          ...local,
          visitors: mergeRecords(local.visitors, remote.visitors),
          rules: mergeRecords(local.rules, remote.rules),
          events: mergeRecords(local.events, remote.events).sort((left, right) => right.at - left.at),
          alerts: mergeRecords(local.alerts, remote.alerts).sort((left, right) => right.event.at - left.event.at),
        }));
        setBackendReady(true);
      } catch (error) {
        if (active) {
          setBackendReady(false);
          toast.error("Supabase security data could not be loaded", {
            description: error instanceof Error ? error.message : "Check the Supabase URL, key, schema, and row-level security policies.",
          });
        }
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (session) void synchronizeSession();
        else {
          setBackendReady(false);
          setRoleState("student");
          setSignedIn(false);
          localStorage.removeItem(ROLE_KEY);
        }
      }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!backendReady) return;
    const timer = window.setTimeout(() => {
      void persistSecuritySnapshot(state).catch((error: unknown) => {
        setBackendReady(false);
        toast.error("Security changes remain saved locally but could not be synced to Supabase", {
          description: error instanceof Error ? error.message : "Check the database connection and permissions.",
        });
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [backendReady, state]);
  const setRole = useCallback((r: Role) => {
    const applyDemoRole = () => {
      localStorage.setItem(ROLE_KEY, r);
      setRoleState(r);
      setSignedIn(true);
    };
    if (!supabase) {
      applyDemoRole();
      return;
    }
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.session) {
        applyDemoRole();
        return;
      }
      const authenticatedRole = await getAuthenticatedRole();
      if (!authenticatedRole) throw new Error("This account is not linked to an authorized campus profile.");
      localStorage.setItem(ROLE_KEY, authenticatedRole);
      setRoleState(authenticatedRole);
      setSignedIn(true);
    }).catch((error: unknown) => {
      toast.error("Could not confirm the signed-in campus role", {
        description: error instanceof Error ? error.message : "Try signing in again.",
      });
    });
  }, []);
  const signOut = useCallback(() => {
    if (supabase) {
      void supabase.auth.signOut().then(({ error }) => {
        if (error) toast.error("Supabase sign-out failed", { description: error.message });
      });
    }
    localStorage.removeItem(ROLE_KEY);
    setRoleState("student");
    setSignedIn(false);
  }, []);

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
    if (!can.manageVisitors(role)) {
      toast.error("You do not have permission to manage visitor records.");
      return;
    }
    const visitor = stateRef.current.visitors.find((candidate) => candidate.id === id);
    if (!visitor) {
      toast.error("The selected visitor could not be found.");
      return;
    }
    if (status === "Checked Out" && visitor.status !== "Active") {
      toast.error("Only active visitors can be checked out.");
      return;
    }
    if (visitor.status === "Checked Out" && status !== "Checked Out") {
      toast.error("Checked-out visitor records cannot be reactivated.");
      return;
    }
    if (visitor.status === status) return;
    setState((s) => ({
      ...s,
      visitors: s.visitors.map((v) => v.id === id
        ? { ...v, status, checkedOutAt: status === "Checked Out" ? Date.now() : undefined }
        : v),
    }));
    toast.success(status === "Checked Out" ? `${visitor.name} checked out` : `${visitor.name} status updated`, {
      description: status === "Checked Out" ? "Historical activity and alerts are retained." : status,
    });
  }, [role]);

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
      const duplicate = s.alerts.some((a) => a.event.id === event.id);
      if (!duplicate) {
        newAlert = { id: `ALT-${crypto.randomUUID().slice(0, 8)}`, event, severity: "High", status: "Active", history: [{ status: "Active", at: event.at, by: "security" }] };
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

  const authorizeIndoorRoute = useCallback(async (visitorId: string, route: IndoorRoute) => {
    const s = stateRef.current;
    const visitor = s.visitors.find((candidate) => candidate.id === visitorId);
    if (!visitor) throw new Error(`Visitor ${visitorId} was not found.`);

    const decision = await evaluateIndoorRouteAccess(visitor, s.rules, route);
    const restrictedArea = decision.deniedAreas[0];
    if (!restrictedArea) {
      const plan = allFloorPlans[route.toFloorId];
      const destination = plan?.rooms.find((room) => room.id === route.toRoomId);
      if (!destination) throw new Error(`Route destination ${route.toFloorId}:${route.toRoomId} does not exist.`);
      const securityLocation = securityLocations.find((location) =>
        location.floorId === route.toFloorId && location.roomId === route.toRoomId
      );
      const event: LocationEvent = {
        id: crypto.randomUUID(),
        personId: visitor.id,
        personName: visitor.name,
        personType: visitor.type,
        cameraId: "ROUTE-PLANNER",
        source: "route",
        locationId: securityLocation?.id ?? destination.id,
        locationName: securityLocation?.name ?? destination.label,
        building: securityLocation?.building ?? plan.title,
        floorId: route.toFloorId,
        roomId: route.toRoomId,
        access: "authorized",
        at: Date.now(),
      };
      setState((previous) => ({ ...previous, events: [event, ...previous.events].slice(0, 200) }));
      return decision;
    }

    const plan = allFloorPlans[restrictedArea.floorId];
    const securityLocation = locationById(restrictedArea.locationId);
    const at = Date.now();
    const event: LocationEvent = {
      id: crypto.randomUUID(),
      personId: visitor.id,
      personName: visitor.name,
      personType: visitor.type,
      cameraId: "ROUTE-PLANNER",
      source: "route",
      locationId: restrictedArea.locationId,
      locationName: securityLocation?.name ?? restrictedArea.label,
      building: securityLocation?.building ?? plan?.title ?? restrictedArea.floorId,
      floorId: restrictedArea.floorId,
      roomId: restrictedArea.roomId,
      access: "restricted",
      at,
    };
    const duplicateAlert = s.alerts.some((alert) => alert.event.id === event.id);
    const alert: SecurityAlert | null = duplicateAlert ? null : {
      id: `ALT-${crypto.randomUUID().slice(0, 8)}`,
      event,
      severity: "High",
      status: "Active",
      history: [{ status: "Active", at, by: "security" }],
    };
    setState((previous) => ({
      ...previous,
      events: [event, ...previous.events].slice(0, 200),
      alerts: alert ? [alert, ...previous.alerts] : previous.alerts,
    }));
    if (alert) {
      if (!s.muted) playAlertChime();
      toast.error(`Restricted route attempt: ${visitor.name}`, {
        description: `${restrictedArea.label} · ${plan?.title ?? restrictedArea.floorId}`,
      });
    }
    return decision;
  }, []);

  const setAlertStatus = useCallback((id: string, status: AlertStatus) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, status, history: [...a.history, { status, at: Date.now(), by: role }] } : a)),
    }));
  }, [role]);

  const setRule = useCallback((id: string, allowed: boolean) => {
    if (!can.manageAccessControl(role)) {
      toast.error("You do not have permission to manage access rules.");
      return;
    }
    const rule = stateRef.current.rules.find((candidate) => candidate.id === id);
    if (!rule) {
      toast.error("The selected access rule could not be found.");
      return;
    }
    if (rule.allowed === allowed) return;
    setState((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, allowed } : r)) }));
    const location = locationById(rule.locationId);
    toast.success(`Access ${allowed ? "allowed" : "restricted"} for ${rule.personType}`, {
      description: `${location?.name ?? rule.locationId} · ${location?.floorLabel ?? "Campus location"}`,
    });
  }, [role]);

  const setMuted = useCallback((muted: boolean) => setState((s) => ({ ...s, muted })), []);

  const currentLocations = useMemo(() => {
    const seen = new Set<string>();
    return state.events.filter((e) => {
      if (e.source === "route") return false;
      if (seen.has(e.personId)) return false;
      seen.add(e.personId);
      const v = state.visitors.find((x) => x.id === e.personId);
      return v?.status !== "Checked Out";
    });
  }, [state.events, state.visitors]);

  const value: Ctx = {
    ...state, role, signedIn, setRole, signOut, highlightedCameraId, setHighlightedCameraId, registerVisitor, setVisitorStatus,
    simulateDetection, authorizeIndoorRoute, setAlertStatus, setRule, setMuted, currentLocations,
  };
  return <SecurityCtx.Provider value={value}>{children}</SecurityCtx.Provider>;
}

export function useSecurity() {
  const c = useContext(SecurityCtx);
  if (!c) throw new Error("useSecurity must be used inside SecurityProvider");
  return c;
}

export const formatTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
