import { personTypes, type AccessRule, type Camera, type PersonType, type SecurityLocation, type Visitor } from "./types";

// Every location points at an existing room in the floor-plan data module.
export const securityLocations: SecurityLocation[] = [
  { id: "main-gate", name: "Main Gate", floorId: "mb-gf", roomId: "main-entrance", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "reception", name: "Reception Office", floorId: "mb-gf", roomId: "help-desk", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "principal-office", name: "Principal Office", floorId: "mb-gf", roomId: "principal", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "cash-counter", name: "Cash Counter", floorId: "mb-gf", roomId: "cash", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "canteen", name: "Canteen", floorId: "mb-gf", roomId: "canteen", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "meeting-room", name: "Meeting Room", floorId: "mb-gf", roomId: "board-room", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "library", name: "Library", floorId: "mb-gf", roomId: "library", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "placement-cell", name: "Placement Cell", floorId: "mb-gf", roomId: "director", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "cse-lab", name: "CSE Laboratory", floorId: "mb-f1", roomId: "comp1", building: "Main Building", floorLabel: "First Floor" },
  { id: "staff-room", name: "Staff Room", floorId: "mb-f1", roomId: "mens-staff", building: "Main Building", floorLabel: "First Floor" },
];

export const locationById = (id: string) => securityLocations.find((l) => l.id === id);

export const cameras: Camera[] = [
  { id: "CAM-01", name: "CAM-01", locationId: "main-gate", status: "online", source: "simulated" },
  { id: "CAM-02", name: "CAM-02", locationId: "reception", status: "online", source: "simulated" },
  { id: "CAM-03", name: "CAM-03", locationId: "cse-lab", status: "online", source: "simulated" },
  { id: "CAM-04", name: "CAM-04", locationId: "staff-room", status: "online", source: "simulated" },
  { id: "CAM-05", name: "CAM-05", locationId: "library", status: "online", source: "simulated" },
  { id: "CAM-06", name: "CAM-06", locationId: "placement-cell", status: "online", source: "simulated" },
];

const allow: Record<PersonType, string[]> = {
  Parent: ["reception", "principal-office", "cash-counter", "canteen"],
  "Product/Business Visitor": ["main-gate", "reception", "meeting-room", "placement-cell"],
  "Inspirational/Motivational Visitor": ["main-gate", "reception", "meeting-room", "library"],
  "Faculty/Staff": ["main-gate", "reception", "meeting-room", "placement-cell", "cse-lab", "staff-room"],
  Recruiter: ["main-gate", "reception", "meeting-room", "placement-cell"],
  "General Visitor": ["main-gate", "reception", "library"],
};

export const defaultRules: AccessRule[] = personTypes.flatMap((type) =>
  securityLocations.map((loc) => ({
    id: `${type}:${loc.id}`,
    personType: type,
    locationId: loc.id,
    allowed: allow[type].includes(loc.id),
  }))
);

export const seedVisitors: Visitor[] = [
  {
    id: "VIS-1019", name: "Anita Sharma", email: "anita.sharma@example.com", mobile: "9000000011", type: "Recruiter", visiting: "Placement Officer",
    purpose: "Campus recruitment drive", authorizedLocationId: "placement-cell", expectedExit: "16:00",
    checkIn: Date.now() - 1000 * 60 * 50, status: "Active", verified: true, returning: false,
  },
];
