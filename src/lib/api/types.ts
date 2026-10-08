// Types aligned with the Express/PostgreSQL backend responses.

export type Role = "student" | "faculty" | "staff" | "management" | "security" | "admin";
export type VisitorType = "parent" | "visitor" | "recruiter";
export type AccessType = "public" | "authorized" | "restricted";
export type AccessStatus = "allowed" | "restricted";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType = "restricted_access" | "unauthorized_movement" | "visitor_expired" | "unknown_person" | "manual";
export type CameraStatus = "online" | "offline" | "maintenance";
export type IntegrationType = "simulated" | "onvif" | "api" | "sdk" | "rtsp" | "vms";
export type VisitorState = "active" | "exited" | "blocked";
/** Colour is derived from access status only — never from visitor type. */
export type MarkerColor = "green" | "red";

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  college_id: string | null;
  department: string | null;
  is_active: boolean;
}

export interface ApiLocation {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  description: string | null;
  access_type: AccessType;
  floor_plan_id: string | null;
  room_id: string | null;
  is_active: boolean;
}

export interface ApiVisitor {
  id: string;
  visitor_code: string;
  full_name: string;
  mobile_number: string | null;
  visitor_type: VisitorType;
  visiting_student_id: string | null;
  purpose: string | null;
  authorized_location_id: string | null;
  authorized_location_name?: string | null;
  entry_time: string | null;
  expected_exit_time: string | null;
  exit_time: string | null;
  status: VisitorState;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAccessRule {
  id: string;
  location_id: string;
  location_name?: string | null;
  subject_type: "user" | "visitor";
  subject_role: Role | VisitorType;
  access_status: AccessStatus;
  created_at: string;
}

export interface ApiCamera {
  id: string;
  camera_name: string;
  camera_location: string | null;
  location_id: string | null;
  location_name?: string | null;
  status: CameraStatus;
  provider: string | null;
  integration_type: IntegrationType;
  stream_url: string | null;
  camera_identifier: string;
  floor_plan_id: string | null;
  room_id: string | null;
  is_active: boolean;
}

export interface ApiAlert {
  id: string;
  person_id: string | null;
  visitor_id: string | null;
  location_id: string | null;
  camera_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string | null;
  status: AlertStatus;
  detected_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  // hydrated display fields
  visitor_name: string | null;
  visitor_code: string | null;
  visitor_type: VisitorType | null;
  location_name: string | null;
  floor_plan_id: string | null;
  room_id: string | null;
  camera_identifier: string | null;
  camera_name: string | null;
}

export interface ApiLocationEvent {
  id: string;
  person_id: string | null;
  visitor_id: string | null;
  camera_id: string | null;
  location_id: string | null;
  detection_method: "cctv" | "manual";
  detected_at: string;
  confidence: number | null;
  access_status: "authorized" | "restricted" | null;
  // hydrated
  visitor_name?: string | null;
  visitor_code?: string | null;
  visitor_type?: VisitorType | null;
  location_name?: string | null;
  floor_plan_id?: string | null;
  room_id?: string | null;
  camera_identifier?: string | null;
  camera_name?: string | null;
}

export interface FaceProfile {
  provider: string;
  external_face_reference: string;
  verification_status: "pending" | "verified" | "rejected";
}

export interface DetectionResult {
  eventId: string;
  personId: string | null;
  visitorId: string | null;
  visitorCode: string | null;
  visitorName: string;
  visitorType: VisitorType | null;
  cameraId: string;
  cameraName: string;
  locationId: string;
  currentLocation: string | null;
  floorPlanId: string | null;
  roomId: string | null;
  status: "authorized" | "restricted";
  access: AccessStatus;
  color: MarkerColor;
  confidence: number;
  detectedAt: string;
  alertCreated: boolean;
  alert: ApiAlert | null;
  simulated?: boolean;
}

export interface NewVisitorInput {
  full_name: string;
  mobile_number?: string | null;
  visitor_type: VisitorType;
  visiting_student_id?: string | null;
  purpose?: string | null;
  authorized_location_id?: string | null;
  expected_exit_time?: string | null;
}
