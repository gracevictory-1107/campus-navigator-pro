import { request, setToken, clearToken, getToken } from "./client";
import type {
  ApiAccessRule,
  ApiAlert,
  ApiCamera,
  CameraStatus,
  IntegrationType,
  ApiLocation,
  ApiLocationEvent,
  ApiUser,
  ApiVisitor,
  DetectionResult,
  FaceProfile,
  NewVisitorInput,
  Role,
} from "./types";

export * from "./types";
export { API_BASE, getToken, clearToken, subscribeRealtime, closeStream, ApiError } from "./client";

export const ALL_ROLES: Role[] = ["student", "faculty", "staff", "management", "security", "admin"];

/** Demo accounts seeded by the backend (see server/src/config/seed.js). */
export const DEMO_ACCOUNTS: { role: Role; email: string; password: string; label: string }[] = [
  { role: "admin", email: "admin@campus.edu", password: "admin123", label: "Admin" },
  { role: "security", email: "security@campus.edu", password: "security123", label: "Security" },
  { role: "faculty", email: "faculty@campus.edu", password: "faculty123", label: "Faculty" },
  { role: "student", email: "student@campus.edu", password: "student123", label: "Student" },
];

// ----------------------------- Auth -----------------------------
export const auth = {
  async login(email: string, password: string): Promise<ApiUser> {
    const r = await request<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(r.token);
    return r.user;
  },
  async register(input: {
    full_name: string;
    email: string;
    password: string;
    role?: Role;
    phone?: string | null;
    college_id?: string | null;
    department?: string | null;
  }): Promise<ApiUser> {
    const r = await request<{ user: ApiUser; token: string }>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    setToken(r.token);
    return r.user;
  },
  async me(): Promise<ApiUser> {
    const r = await request<{ user: ApiUser }>("/auth/me");
    return r.user;
  },
  logout(): void {
    clearToken();
  },
};

// --------------------------- Visitors ---------------------------
export const visitors = {
  async list(): Promise<ApiVisitor[]> {
    const r = await request<{ visitors: ApiVisitor[] }>("/visitors");
    return r.visitors;
  },
  async get(id: string): Promise<{ visitor: ApiVisitor; lastEvent: ApiLocationEvent | null; faceProfile: FaceProfile | null }> {
    return request(`/visitors/${encodeURIComponent(id)}`);
  },
  async create(input: NewVisitorInput): Promise<ApiVisitor> {
    const r = await request<{ visitor: ApiVisitor }>("/visitors", { method: "POST", body: input });
    return r.visitor;
  },
  async update(id: string, patch: Partial<NewVisitorInput> & { status?: ApiVisitor["status"] }): Promise<ApiVisitor> {
    const r = await request<{ visitor: ApiVisitor }>(`/visitors/${encodeURIComponent(id)}`, { method: "PUT", body: patch });
    return r.visitor;
  },
  async checkIn(id: string): Promise<ApiVisitor> {
    const r = await request<{ visitor: ApiVisitor }>(`/visitors/${encodeURIComponent(id)}/check-in`, { method: "POST" });
    return r.visitor;
  },
  async checkOut(id: string): Promise<ApiVisitor> {
    const r = await request<{ visitor: ApiVisitor }>(`/visitors/${encodeURIComponent(id)}/check-out`, { method: "POST" });
    return r.visitor;
  },
};

// ----------------------------- Face -----------------------------
export const face = {
  async enroll(visitorId?: string, personId?: string): Promise<{ enrolled: boolean; profile: FaceProfile & { id: string }; verified: boolean }> {
    return request("/face/enroll", { method: "POST", body: { visitorId, personId } });
  },
  async verify(input: { visitorId?: string; personId?: string; externalFaceReference?: string }): Promise<{
    verified: boolean;
    personId: string | null;
    visitorId?: string | null;
    visitor?: ApiVisitor | null;
    externalFaceReference?: string;
    provider: string;
    simulated?: boolean;
    reason?: string;
  }> {
    return request("/face/verify", { method: "POST", body: input });
  },
};

// --------------------------- Locations --------------------------
export const locations = {
  async list(): Promise<ApiLocation[]> {
    const r = await request<{ locations: ApiLocation[] }>("/locations");
    return r.locations;
  },
  async create(input: Partial<ApiLocation> & { name: string }): Promise<ApiLocation> {
    const r = await request<{ location: ApiLocation }>("/locations", { method: "POST", body: input });
    return r.location;
  },
  async update(id: string, patch: Partial<ApiLocation>): Promise<ApiLocation> {
    const r = await request<{ location: ApiLocation }>(`/locations/${encodeURIComponent(id)}`, { method: "PUT", body: patch });
    return r.location;
  },
  async remove(id: string): Promise<void> {
    await request(`/locations/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

// -------------------------- Access rules ------------------------
export const accessRules = {
  async list(): Promise<ApiAccessRule[]> {
    const r = await request<{ accessRules: ApiAccessRule[] }>("/access-rules");
    return r.accessRules;
  },
  async create(input: { location_id: string; subject_type: "user" | "visitor"; subject_role: string; access_status: "allowed" | "restricted" }): Promise<ApiAccessRule> {
    const r = await request<{ accessRule: ApiAccessRule }>("/access-rules", { method: "POST", body: input });
    return r.accessRule;
  },
  async update(id: string, patch: Partial<ApiAccessRule>): Promise<ApiAccessRule> {
    const r = await request<{ accessRule: ApiAccessRule }>(`/access-rules/${encodeURIComponent(id)}`, { method: "PUT", body: patch });
    return r.accessRule;
  },
  async remove(id: string): Promise<void> {
    await request(`/access-rules/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

// ---------------------------- Cameras ---------------------------
export const cameras = {
  async list(): Promise<ApiCamera[]> {
    const r = await request<{ cameras: ApiCamera[] }>("/cameras");
    return r.cameras;
  },
  async create(input: Partial<ApiCamera> & { camera_name: string; camera_identifier: string }): Promise<ApiCamera> {
    const r = await request<{ camera: ApiCamera }>("/cameras", { method: "POST", body: input });
    return r.camera;
  },
  async update(id: string, patch: Partial<ApiCamera>): Promise<ApiCamera> {
    const r = await request<{ camera: ApiCamera }>(`/cameras/${encodeURIComponent(id)}`, { method: "PUT", body: patch });
    return r.camera;
  },
  async remove(id: string): Promise<void> {
    await request(`/cameras/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  async status(id: string): Promise<{ cameraId: string; status: CameraStatus; integrationType: IntegrationType; live: boolean }> {
    return request(`/cameras/${encodeURIComponent(id)}/status`);
  },
  async stream(id: string): Promise<{ cameraId: string; type: IntegrationType | string; placeholder: boolean; streamUrl: string | null }> {
    return request(`/cameras/${encodeURIComponent(id)}/stream`);
  },
};

// ------------------------- CCTV detection -----------------------
export const cctv = {
  async simulateDetection(cameraId: string, visitorId?: string, personId?: string): Promise<DetectionResult> {
    return request("/cctv/simulate-detection", { method: "POST", body: { cameraId, visitorId, personId } });
  },
  async detection(cameraId: string, visitorId?: string, personId?: string): Promise<DetectionResult> {
    return request("/cctv/detection", { method: "POST", body: { cameraId, visitorId, personId } });
  },
};

// ------------------------ Location events -----------------------
export const locationEvents = {
  async list(): Promise<ApiLocationEvent[]> {
    const r = await request<{ events: ApiLocationEvent[] }>("/location-events");
    return r.events;
  },
  async forPerson(personId: string): Promise<ApiLocationEvent[]> {
    const r = await request<{ events: ApiLocationEvent[] }>(`/location-events/${encodeURIComponent(personId)}`);
    return r.events;
  },
};

// ----------------------------- Alerts ---------------------------
export const alerts = {
  async list(status?: string): Promise<ApiAlert[]> {
    const r = await request<{ alerts: ApiAlert[] }>(`/alerts${status ? `?status=${status}` : ""}`);
    return r.alerts;
  },
  async get(id: string): Promise<ApiAlert> {
    const r = await request<{ alert: ApiAlert }>(`/alerts/${encodeURIComponent(id)}`);
    return r.alert;
  },
  async acknowledge(id: string): Promise<ApiAlert> {
    const r = await request<{ alert: ApiAlert }>(`/alerts/${encodeURIComponent(id)}/acknowledge`, { method: "PUT" });
    return r.alert;
  },
  async resolve(id: string): Promise<ApiAlert> {
    const r = await request<{ alert: ApiAlert }>(`/alerts/${encodeURIComponent(id)}/resolve`, { method: "PUT" });
    return r.alert;
  },
};

// ----------------------------- Users ----------------------------
export const users = {
  async list(): Promise<ApiUser[]> {
    const r = await request<{ users: ApiUser[] }>("/users");
    return r.users;
  },
  async update(id: string, patch: { role?: Role; is_active?: boolean }): Promise<ApiUser> {
    const r = await request<{ user: ApiUser }>(`/users/${encodeURIComponent(id)}`, { method: "PUT", body: patch });
    return r.user;
  },
};
