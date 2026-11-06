import { createClient } from "@supabase/supabase-js";
import { normalizeVisitorEmail } from "@/lib/visitorNormalization";
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
  role: "admin" | "faculty" | "staff" | "management" | "security" | "student" | "pending";
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
  email: string | null;
  is_active?: boolean;
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

interface CameraConfigRow extends Record<string, unknown> {
  camera_id: string;
  ip_address: string;
  stream_url: string;
  created_at: string;
  updated_at: string;
}

interface CameraCoverageAreaRow extends Record<string, unknown> {
  id: string;
  building: string;
  floor_id: string | null;
  area_label: string;
  coverage_type: "camera_present" | "camera_free" | "unknown";
  camera_id: string | null;
  source_image: string | null;
  notes: string;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Omit<ProfileRow, "created_at" | "updated_at">>;
      access_rules: Table<AccessRuleRow, Omit<AccessRuleRow, "created_at" | "updated_at">>;
      visitors: Table<VisitorRow, Omit<VisitorRow, "created_at" | "updated_at">>;
      security_events: Table<SecurityEventRow, Omit<SecurityEventRow, "created_at">>;
      alerts: Table<AlertRow, Omit<AlertRow, "created_at" | "updated_at">>;
      biometric_profiles: Table<BiometricProfileRow, Omit<BiometricProfileRow, "id" | "created_at" | "updated_at">>;
      biometric_verification_events: Table<BiometricVerificationEventRow, Omit<BiometricVerificationEventRow, "id" | "created_at">>;
      camera_configs: Table<CameraConfigRow, Omit<CameraConfigRow, "created_at" | "updated_at">>;
      camera_coverage_areas: Table<CameraCoverageAreaRow, Omit<CameraCoverageAreaRow, "id" | "created_at" | "updated_at">>;
    };
    Views: Record<string, never>;
    Functions: {
      create_profile_for_current_user: {
        Args: { p_full_name?: string | null };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL?.trim();

export const supabaseAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const neonDataConfigured = Boolean(neonDataApiUrl && supabaseAuthConfigured);
/** The app requires both the existing identity provider and the Neon campus database. */
export const supabaseConfigured = supabaseAuthConfigured && neonDataConfigured;

/** Supabase Auth remains the temporary identity provider while database reads/writes move to Neon. */
export const supabase = supabaseAuthConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/**
 * Neon Data API is PostgREST-compatible. Its requests carry the current Supabase
 * access token so Neon verifies the identity through the configured external JWKS
 * provider and applies the migrated PostgreSQL RLS policies.
 *
 * The URL is the database base path without the trailing /rest/v1 segment because
 * supabase-js appends that segment when it builds the PostgREST client URL.
 */
export const neon = neonDataConfigured
  ? createClient<Database>(neonDataApiUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      accessToken: async () => {
        if (!supabase) return null;
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return null;
        return session?.access_token ?? null;
      },
    })
  : null;

export type ManagedProfile = Pick<ProfileRow, "id" | "full_name" | "email" | "role">;
export type ManagedRole = ProfileRow["role"];

const mapAppRole = (role: ManagedRole): Role => role;

type AuthUserRegistrationMetadata = {
  email_confirmed_at?: string | null;
  app_metadata?: { provider?: unknown; providers?: unknown };
};

/**
 * Campus Google login is only allowed for an existing email/password account
 * whose email confirmation has completed. A Google-only Auth user must not
 * receive a campus role just because the provider has a verified email.
 */
export function hasVerifiedEmailPasswordIdentity(user: AuthUserRegistrationMetadata | null | undefined): boolean {
  if (!user?.email_confirmed_at) return false;

  const providers = user.app_metadata?.providers;
  const hasEmailIdentity = Array.isArray(providers)
    ? providers.includes("email")
    : user.app_metadata?.provider === "email";

  return hasEmailIdentity;
}

async function getSignedInProfile() {
  if (!supabase || !neon) return null;
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const selectProfile = () => neon
    .from("profiles")
    .select("id, auth_user_id, full_name, email, role, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const existing = await selectProfile();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  // The profile is created inside Neon with the JWT subject/email and a fixed
  // "pending" role. The browser cannot choose or self-assign a campus role.
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = typeof metadata?.full_name === "string"
    ? metadata.full_name
    : typeof metadata?.name === "string"
      ? metadata.name
      : null;
  const { error: provisionError } = await neon.rpc("create_profile_for_current_user", {
    p_full_name: fullName,
  });
  if (provisionError) throw provisionError;

  const provisioned = await selectProfile();
  if (provisioned.error) throw provisioned.error;
  return provisioned.data;
}

export async function signInWithSupabase(email: string, password: string): Promise<Role> {
  if (!supabase) throw new Error("Account sign-in is unavailable because Supabase is not configured.");
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (signInError) throw signInError;
  try {
    const profile = await getSignedInProfile();
    if (!profile) throw new Error("Your account has no campus profile yet. Verify your email, then try again. If this continues, contact the campus administrator.");
    return mapAppRole(profile.role);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

/** Start Supabase's Google OAuth flow and return to the public auth callback. */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error("Google sign-in is unavailable because Supabase is not configured.");

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

export async function signUpWithSupabase(
  fullName: string,
  email: string,
  password: string,
): Promise<{ role: Role | null; needsEmailConfirmation: boolean }> {
  if (!supabase) throw new Error("Account creation is unavailable because Supabase is not configured.");
  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { full_name: cleanName },
      // Always return email confirmation links to the live app, even when signup starts from localhost.
      emailRedirectTo: "https://campus-navigator-pro.vercel.app/auth/callback",
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Account creation did not complete. Please try again.");

  if (!data.session) {
    return { role: null, needsEmailConfirmation: true };
  }

  const profile = await getSignedInProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("Your account was created, but its campus profile was not provisioned. Contact the campus administrator.");
  }
  return { role: mapAppRole(profile.role), needsEmailConfirmation: false };
}

export async function getAuthenticatedRole(): Promise<Role | null> {
  if (!supabase || !neon) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!hasVerifiedEmailPasswordIdentity(user)) return null;

  const profile = await getSignedInProfile();
  return profile ? mapAppRole(profile.role) : null;
}

export async function loadAdminProfiles(): Promise<ManagedProfile[] | null> {
  const profile = await getSignedInProfile();
  if (profile?.role !== "admin" || !neon) return null;
  const { data, error } = await neon
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function updateManagedProfileRole(id: string, role: ManagedRole): Promise<ManagedProfile> {
  const profile = await getSignedInProfile();
  if (profile?.role !== "admin" || !neon) throw new Error("A linked campus Admin account is required to change user roles.");
  const { data, error } = await neon
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
  if (!profile || !neon || (profile.role !== "admin" && profile.role !== "security" && profile.role !== "management")) return null;
  const [rulesResult, visitorsResult, eventsResult, alertsResult] = await Promise.all([
    neon.from("access_rules").select("*"),
    neon.from("visitors").select("*"),
    neon.from("security_events").select("*").order("occurred_at", { ascending: false }),
    neon.from("alerts").select("*").order("created_at", { ascending: false }),
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
    email: normalizeVisitorEmail(row.email),
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
  if (!profile || !neon || (profile.role !== "admin" && profile.role !== "security")) {
    throw new Error("A linked Security or Admin campus account is required to save campus security data.");
  }
  const visitorRows = snapshot.visitors.map((visitor) => ({
    id: visitor.id,
    name: visitor.name,
    email: normalizeVisitorEmail(visitor.email),
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

  const visitorsWrite = visitorRows.length ? await neon.from("visitors").upsert(visitorRows) : { error: null };
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
  const eventsWrite = eventRows.length ? await neon.from("security_events").upsert(eventRows) : { error: null };
  if (eventsWrite.error) throw eventsWrite.error;
  const rulesWrite = ruleRows.length ? await neon.from("access_rules").upsert(ruleRows) : { error: null };
  if (rulesWrite.error) throw rulesWrite.error;
  const alertsWrite = alertRows.length ? await neon.from("alerts").upsert(alertRows) : { error: null };
  if (alertsWrite.error) throw alertsWrite.error;
}


/**
 * Persists the visitor row before any biometric profile or verification event is
 * written. Those tables reference visitors.id, so relying on the debounced
 * SecurityContext snapshot can race and cause foreign-key failures.
 */
export async function saveVisitorRecord(visitor: Visitor): Promise<void> {
  if (!neon) return;

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) {
    throw new Error("A linked Security or Admin campus account is required to save visitor records.");
  }

  const { error } = await neon.from("visitors").upsert({
    id: visitor.id,
    name: visitor.name.trim(),
    email: normalizeVisitorEmail(visitor.email),
    mobile: visitor.mobile.trim(),
    person_type: visitor.type,
    visiting: visitor.visiting.trim(),
    purpose: visitor.purpose.trim(),
    authorized_location_id: visitor.authorizedLocationId,
    expected_exit: visitor.expectedExit,
    check_in: visitor.checkIn,
    checked_out_at: visitor.checkedOutAt ?? null,
    status: visitor.status,
    verified: visitor.verified,
    returning: visitor.returning,
  });
  if (error) throw error;
}


export interface BiometricStoredProfile {
  id: string;
  visitorId: string;
  embedding: number[];
  status: string;
}

/**
 * Biometric templates are intentionally not read or stored in browser memory,
 * localStorage, or the Neon Data API. Re-enable only after encrypted server-side
 * storage and server-side matching are implemented and approved.
 */
export async function getBiometricEmbedding(_visitorId: string): Promise<number[] | null> {
  return null;
}

export async function saveBiometricEmbedding(_visitorId: string, _embedding: number[]): Promise<BiometricStoredProfile> {
  throw new Error("Biometric enrollment is temporarily disabled. Secure server-side template storage and matching must be integrated first.");
}

export async function loadAllBiometricEmbeddings(): Promise<Array<{ visitorId: string; embedding: number[] }>> {
  return [];
}

export async function recordBiometricVerificationEvent(input: {
  visitorId: string;
  result: "VERIFIED" | "NOT_VERIFIED" | "NO_ENROLLMENT" | "VERIFICATION_ERROR";
  eventType?: string;
  destination?: string;
  accessResult?: "authorized" | "restricted";
  cameraId?: string;
}) {
  if (!neon) return;

  const profile = await getSignedInProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "security")) return;

  const { error } = await neon.from("biometric_verification_events").insert({
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


export interface CameraConfig {
  cameraId: string;
  ipAddress: string;
  streamUrl: string;
}

export async function loadCameraConfigs(): Promise<Record<string, CameraConfig>> {
  const profile = await getSignedInProfile();
  if (!profile || !neon || !["admin", "management", "security"].includes(profile.role)) {
    return {};
  }

  const { data, error } = await neon
    .from("camera_configs")
    .select("camera_id");

  if (error) throw error;

  return data.reduce<Record<string, CameraConfig>>((configs, row) => {
    configs[row.camera_id] = {
      cameraId: row.camera_id,
      ipAddress: "",
      streamUrl: "",
    };
    return configs;
  }, {});
}

export async function saveCameraConfig(_config: CameraConfig): Promise<void> {
  throw new Error("Camera stream settings are locked until the approved server-side CCTV gateway is integrated. Do not enter RTSP URLs, private IPs, or credentials in the browser.");
}
