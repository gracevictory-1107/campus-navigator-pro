import { createClient } from "@supabase/supabase-js";
import type { AccessRule, AlertStatus, LocationEvent, PersonType, Role, SecurityAlert, Visitor } from "@/security/types";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

interface ProfileRow extends Record<string, unknown> {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: "admin" | "faculty" | "security" | "student";
  created_at: string;
  updated_at: string;
}

interface AccessRuleRow extends Record<string, unknown> {
  id: string;
  location_id: string;
  person_type: string;
  allowed: boolean;
  created_at: string;
  updated_at: string;
}

interface VisitorRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  mobile: string;
  person_type: string;
  visiting: string;
  purpose: string;
  authorized_location_id: string;
  expected_exit: string;
  check_in: number;
  checked_out_at: number | null;
  status: string;
  verified: boolean;
  returning: boolean;
  created_at: string;
  updated_at: string;
}

interface SecurityEventRow extends Record<string, unknown> {
  id: string;
  person_id: string;
  person_name: string;
  person_type: string;
  camera_id: string;
  source: string | null;
  location_id: string;
  location_name: string | null;
  building: string;
  floor_id: string;
  room_id: string;
  access: string;
  occurred_at: number;
  created_at: string;
}

interface AlertRow extends Record<string, unknown> {
  id: string;
  event_id: string;
  event_snapshot: Json;
  severity: string;
  status: string;
  history: Json;
  created_at: string;
  updated_at: string;
}

interface BiometricProfileRow extends Record<string, unknown> {
  id: string;
  visitor_id: string | null;
  provider_reference: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BiometricVerificationEventRow extends Record<string, unknown> {
  id: string;
  profile_id: string | null;
  visitor_id: string | null;
  event_type: string;
  verification_result: string;
  destination: string | null;
  access_result: string | null;
  camera_id: string | null;
  security_event_id: string | null;
  occurred_at: number;
  created_at: string;
}

interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Omit<ProfileRow, "created_at" | "updated_at">>;
      access_rules: Table<AccessRuleRow, Omit<AccessRuleRow, "created_at" | "updated_at">>;
      visitors: Table<VisitorRow, Omit<VisitorRow, "created_at" | "updated_at">>;
      security_events: Table<SecurityEventRow, Omit<SecurityEventRow, "created_at">>;
      alerts: Table<AlertRow, Omit<AlertRow, "created_at" | "updated_at">>;
      biometric_profiles: Table<BiometricProfileRow, Omit<BiometricProfileRow, "created_at" | "updated_at">>;
      biometric_verification_events: Table<BiometricVerificationEventRow, Omit<BiometricVerificationEventRow, "created_at">>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type ManagedProfile = Pick<ProfileRow, "id" | "full_name" | "email" | "role">;
export type ManagedRole = ProfileRow["role"];

const mapAppRole = (role: ManagedRole): Role => role;

async function getSignedInProfile() {
  if (!supabase) return null;
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, full_name, email, role, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function signInWithSupabase(email: string, password: string): Promise<Role> {
  if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  try {
    const profile = await getSignedInProfile();
    if (!profile) throw new Error("This account is not linked to an authorized campus profile.");
    return mapAppRole(profile.role);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

export async function getAuthenticatedRole(): Promise<Role | null> {
  const profile = await getSignedInProfile();
  return profile ? mapAppRole(profile.role) : null;
}

export async function loadAdminProfiles(): Promise<ManagedProfile[] | null> {
  const profile = await getSignedInProfile();
  if (profile?.role !== "admin" || !supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function updateManagedProfileRole(id: string, role: ManagedRole): Promise<ManagedProfile> {
  const profile = await getSignedInProfile();
  if (profile?.role !== "admin" || !supabase) throw new Error("A linked Supabase Admin account is required to change user roles.");
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id, full_name, email, role")
    .single();
  if (error) throw error;
  return data;
}

export interface SupabaseSecuritySnapshot {
  rules: AccessRule[];
  visitors: Visitor[];
  events: LocationEvent[];
  alerts: SecurityAlert[];
}

export async function loadSecuritySnapshot(): Promise<SupabaseSecuritySnapshot | null> {
  const profile = await getSignedInProfile();
  if (!profile || !supabase || (profile.role !== "admin" && profile.role !== "security")) return null;
  const [rulesResult, visitorsResult, eventsResult, alertsResult] = await Promise.all([
    supabase.from("access_rules").select("*"),
    supabase.from("visitors").select("*"),
    supabase.from("security_events").select("*").order("occurred_at", { ascending: false }),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }),
  ]);
  const failure = rulesResult.error ?? visitorsResult.error ?? eventsResult.error ?? alertsResult.error;
  if (failure) throw failure;

  const rules = rulesResult.data.map((row) => ({
    id: row.id,
    locationId: row.location_id,
    personType: row.person_type as PersonType,
    allowed: row.allowed,
  }));
  const visitors = visitorsResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    type: row.person_type as PersonType,
    visiting: row.visiting,
    purpose: row.purpose,
    authorizedLocationId: row.authorized_location_id,
    expectedExit: row.expected_exit,
    checkIn: Number(row.check_in),
    ...(row.checked_out_at === null ? {} : { checkedOutAt: Number(row.checked_out_at) }),
    status: row.status as Visitor["status"],
    verified: row.verified,
    returning: row.returning,
  }));
  const events = eventsResult.data.map((row) => ({
    id: row.id,
    personId: row.person_id,
    personName: row.person_name,
    personType: row.person_type as PersonType,
    cameraId: row.camera_id,
    ...(row.source === "route" ? { source: "route" as const } : {}),
    locationId: row.location_id,
    ...(row.location_name === null ? {} : { locationName: row.location_name }),
    building: row.building,
    floorId: row.floor_id,
    roomId: row.room_id,
    access: row.access as LocationEvent["access"],
    at: Number(row.occurred_at),
  }));
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const alerts = alertsResult.data.flatMap((row) => {
    const event = eventsById.get(row.event_id) ?? row.event_snapshot as unknown as LocationEvent;
    if (!event || !event.id) return [];
    return [{
      id: row.id,
      event,
      severity: row.severity as SecurityAlert["severity"],
      status: row.status as AlertStatus,
      history: row.history as SecurityAlert["history"],
    }];
  });
  return { rules, visitors, events, alerts };
}

export async function persistSecuritySnapshot(snapshot: SupabaseSecuritySnapshot): Promise<void> {
  const profile = await getSignedInProfile();
  if (!profile || !supabase || (profile.role !== "admin" && profile.role !== "security")) {
    throw new Error("A linked Supabase Security or Admin account is required to save campus security data.");
  }
  const visitorRows = snapshot.visitors.map((visitor) => ({
    id: visitor.id,
    name: visitor.name,
    email: visitor.email,
    mobile: visitor.mobile,
    person_type: visitor.type,
    visiting: visitor.visiting,
    purpose: visitor.purpose,
    authorized_location_id: visitor.authorizedLocationId,
    expected_exit: visitor.expectedExit,
    check_in: visitor.checkIn,
    checked_out_at: visitor.checkedOutAt ?? null,
    status: visitor.status,
    verified: visitor.verified,
    returning: visitor.returning,
  }));
  const ruleRows = snapshot.rules.map((rule) => ({
    id: rule.id,
    location_id: rule.locationId,
    person_type: rule.personType,
    allowed: rule.allowed,
  }));
  const alertRows = snapshot.alerts.map((alert) => ({
    id: alert.id,
    event_id: alert.event.id,
    event_snapshot: alert.event as unknown as Json,
    severity: alert.severity,
    status: alert.status,
    history: alert.history as unknown as Json,
  }));

  const visitorsWrite = visitorRows.length ? await supabase.from("visitors").upsert(visitorRows) : { error: null };
  if (visitorsWrite.error) throw visitorsWrite.error;
  const eventRows = snapshot.events.map((event) => ({
    id: event.id,
    person_id: event.personId,
    person_name: event.personName,
    person_type: event.personType,
    camera_id: event.cameraId,
    source: event.source ?? null,
    location_id: event.locationId,
    location_name: event.locationName ?? null,
    building: event.building,
    floor_id: event.floorId,
    room_id: event.roomId,
    access: event.access,
    occurred_at: event.at,
  }));
  const eventsWrite = eventRows.length ? await supabase.from("security_events").upsert(eventRows) : { error: null };
  if (eventsWrite.error) throw eventsWrite.error;
  const rulesWrite = ruleRows.length ? await supabase.from("access_rules").upsert(ruleRows) : { error: null };
  if (rulesWrite.error) throw rulesWrite.error;
  const alertsWrite = alertRows.length ? await supabase.from("alerts").upsert(alertRows) : { error: null };
  if (alertsWrite.error) throw alertsWrite.error;
}


export interface BiometricStoredProfile {
  id: string;
  visitorId: string;
  embedding: number[];
  status: string;
}

function biometricLocalKey(visitorId: string) {
  return "campus-biometric:" + visitorId;
}

export async function getBiometricEmbedding(visitorId: string): Promise<number[] | null> {
  if (!supabase) {
    try {
      const raw = localStorage.getItem(biometricLocalKey(visitorId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) {
    try {
      const raw = localStorage.getItem(biometricLocalKey(visitorId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  const { data, error } = await supabase
    .from("biometric_profiles")
    .select("id, visitor_id, provider_reference, status")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.provider_reference) return null;

  try {
    const parsed = JSON.parse(data.provider_reference) as { version?: number; embedding?: unknown };
    return Array.isArray(parsed.embedding) && parsed.embedding.every((item) => typeof item === "number" && Number.isFinite(item))
      ? parsed.embedding
      : null;
  } catch {
    return null;
  }
}

export async function saveBiometricEmbedding(visitorId: string, embedding: number[]): Promise<BiometricStoredProfile> {
  if (!supabase) {
    localStorage.setItem(biometricLocalKey(visitorId), JSON.stringify(embedding));
    return { id: "LOCAL-" + visitorId, visitorId, embedding, status: "ENROLLED" };
  }

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) {
    localStorage.setItem(biometricLocalKey(visitorId), JSON.stringify(embedding));
    return { id: "LOCAL-" + visitorId, visitorId, embedding, status: "ENROLLED" };
  }

  const providerReference = JSON.stringify({ version: 1, embedding });
  const { data: existing, error: existingError } = await supabase
    .from("biometric_profiles")
    .select("id")
    .eq("visitor_id", visitorId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("biometric_profiles")
      .update({ provider_reference: providerReference, status: "ENROLLED" })
      .eq("id", existing.id)
      .select("id, visitor_id, provider_reference, status")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      visitorId,
      embedding,
      status: data.status,
    };
  }

  const { data, error } = await supabase
    .from("biometric_profiles")
    .insert({
      visitor_id: visitorId,
      provider_reference: providerReference,
      status: "ENROLLED",
    })
    .select("id, visitor_id, provider_reference, status")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    visitorId,
    embedding,
    status: data.status,
  };
}

export async function loadAllBiometricEmbeddings(): Promise<Array<{ visitorId: string; embedding: number[] }>> {
  const valid = (value: unknown): value is number[] =>
    Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "number" && Number.isFinite(item));

  if (!supabase) {
    const entries: Array<{ visitorId: string; embedding: number[] }> = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("campus-biometric:")) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "null");
        if (valid(parsed)) entries.push({ visitorId: key.slice("campus-biometric:".length), embedding: parsed });
      } catch { /* ignore malformed local biometric records */ }
    }
    return entries;
  }

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) {
    const entries: Array<{ visitorId: string; embedding: number[] }> = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("campus-biometric:")) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "null");
        if (valid(parsed)) entries.push({ visitorId: key.slice("campus-biometric:".length), embedding: parsed });
      } catch { /* ignore malformed local biometric records */ }
    }
    return entries;
  }

  const { data, error } = await supabase
    .from("biometric_profiles")
    .select("visitor_id, provider_reference, status")
    .eq("status", "ENROLLED");

  if (error) throw error;

  return data.flatMap((row) => {
    if (!row.visitor_id || !row.provider_reference) return [];
    try {
      const parsed = JSON.parse(row.provider_reference) as { embedding?: unknown };
      return valid(parsed.embedding) ? [{ visitorId: row.visitor_id, embedding: parsed.embedding }] : [];
    } catch {
      return [];
    }
  });
}

export async function recordBiometricVerificationEvent(input: {
  visitorId: string;
  result: "VERIFIED" | "NOT_VERIFIED" | "NO_ENROLLMENT" | "VERIFICATION_ERROR";
  eventType?: string;
  destination?: string;
  accessResult?: "authorized" | "restricted";
  cameraId?: string;
}) {
  if (!supabase) return;

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) return;

  const { error } = await supabase.from("biometric_verification_events").insert({
    visitor_id: input.visitorId,
    event_type: input.eventType ?? "visitor_face_verification",
    verification_result: input.result,
    destination: input.destination ?? null,
    access_result: input.accessResult ?? null,
    camera_id: input.cameraId ?? null,
    security_event_id: null,
    occurred_at: Date.now(),
  });
  if (error) throw error;
}
