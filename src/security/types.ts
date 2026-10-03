export type Role = "student" | "faculty" | "staff" | "management" | "security" | "admin";
export type PersonType = "Parent" | "Visitor" | "Recruiter";
export type AccessStatus = "authorized" | "restricted";
export type VisitorStatus = "Active" | "Checked Out" | "Blocked";
export type AlertStatus = "Active" | "Acknowledged" | "Resolved";

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
}

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  type: PersonType;
  visiting: string;
  purpose: string;
  authorizedLocationId: string;
  expectedExit: string;
  checkIn: number;
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
  locationId: string;
  building: string;
  floorId: string;
  roomId: string;
  access: AccessStatus;
  at: number;
}

export interface SecurityAlert {
  id: string;
  event: LocationEvent;
  severity: "HIGH";
  status: AlertStatus;
  history: { status: AlertStatus; at: number; by: Role }[];
}
