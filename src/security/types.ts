export type Role = "pending" | "student" | "faculty" | "staff" | "management" | "security" | "admin";
export const personTypes = [
  "Parent",
  "Product/Business Visitor",
  "Inspirational/Motivational Visitor",
  "Faculty/Staff",
  "Recruiter",
  "General Visitor",
] as const;
export type PersonType = (typeof personTypes)[number];
export type AccessStatus = "authorized" | "restricted";
export type VisitorStatus = "Registered" | "Active" | "Checked Out" | "Blocked";
export type AlertStatus = "Active" | "Acknowledged" | "Resolved";
export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";

/** A named security location mapped onto an existing floor-plan room (geometry is never copied). */
export interface SecurityLocation {
  id: string;
  name: string;
  floorId: string;
  roomId: string;
  building: string;
  floorLabel: string;
}

export interface Camera {
  id: string;
  name: string;
  locationId: string;
  status: "online" | "offline";
  /** Future integrations: "nvr" | "dvr" | "vms" | "onvif" | "vendor-api" | "vendor-sdk". */
  source: "simulated";
  /** Filled in by the college when real CCTV integration is configured. */
  ipAddress?: string;
  /** Optional browser-accessible stream URL supplied by the college/NVR. */
  streamUrl?: string;
}

export interface Visitor {
  id: string;
  name: string;
  email: string;
  mobile: string;
  type: PersonType;
  visiting: string;
  purpose: string;
  authorizedLocationId: string;
  expectedExit: string;
  checkIn: number;
  checkedOutAt?: number;
  status: VisitorStatus;
  verified: boolean;
  returning: boolean;
}

export interface AccessRule {
  id: string;
  locationId: string;
  personType: PersonType;
  allowed: boolean;
}

/** Shape of a CCTV / video-analytics location event. */
export interface LocationEvent {
  id: string;
  personId: string;
  personName: string;
  personType: PersonType;
  cameraId: string;
  source?: "route";
  locationId: string;
  locationName?: string;
  building: string;
  floorId: string;
  roomId: string;
  access: AccessStatus;
  at: number;
}

export interface SecurityAlert {
  id: string;
  event: LocationEvent;
  severity: AlertSeverity;
  status: AlertStatus;
  history: { status: AlertStatus; at: number; by: Role }[];
}
