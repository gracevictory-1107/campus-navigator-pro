import { allFloorPlans } from "@/data/floorPlans";
import { personTypes, type AccessRule, type Camera, type PersonType, type SecurityLocation, type Visitor } from "./types";

const officeLocations: SecurityLocation[] = [
  { id: "principal-office", name: "Principal Office", floorId: "mb-gf", roomId: "principal", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "placement-cell", name: "Director / Placement Office", floorId: "mb-gf", roomId: "director", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "administrative-office", name: "Administrative Office", floorId: "mb-gf", roomId: "admin-desk", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "vice-principal-office", name: "Vice Principal Office", floorId: "mb-gf", roomId: "vp-cabin", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "reception", name: "Reception Office", floorId: "mb-gf", roomId: "help-desk", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "office-desk", name: "Office Desk", floorId: "mb-gf", roomId: "office-desk", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "cash-counter", name: "Cash Counter", floorId: "mb-gf", roomId: "cash", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "main-f2-hod-office", name: "HOD Office", floorId: "mb-f2", roomId: "hod", building: "Main Building", floorLabel: "Floor 2" },
  { id: "main-f3-hod-office", name: "HOD Office", floorId: "mb-f3", roomId: "hod", building: "Main Building", floorLabel: "Floor 3" },
  { id: "main-f4-hod-office", name: "HOD Office", floorId: "mb-f4", roomId: "hod", building: "Main Building", floorLabel: "Floor 4" },
  { id: "main-f5-hod-office", name: "HOD Office", floorId: "mb-f5", roomId: "hod", building: "Main Building", floorLabel: "Floor 5" },
  { id: "fisheries-dean-office", name: "Dean of Fisheries Office", floorId: "fb-gf", roomId: "dean", building: "Fisheries Block", floorLabel: "Ground Floor" },
];

const fixedLocations: SecurityLocation[] = [
  { id: "main-gate", name: "Main Gate", floorId: "mb-gf", roomId: "main-entrance", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "canteen", name: "Canteen", floorId: "mb-gf", roomId: "canteen", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "meeting-room", name: "Board Room", floorId: "mb-gf", roomId: "board-room", building: "Main Building", floorLabel: "Ground Floor" },
  { id: "library", name: "Library", floorId: "mb-gf", roomId: "library", building: "Main Building", floorLabel: "Ground Floor", admissionsOnly: true },
  { id: "cse-lab", name: "Computer Laboratory 1", floorId: "mb-f1", roomId: "comp1", building: "Main Building", floorLabel: "Floor 1" },
  { id: "staff-room", name: "Men's Staff Room", floorId: "mb-f1", roomId: "mens-staff", building: "Main Building", floorLabel: "Floor 1" },
  { id: "mini-seminar-hall", name: "Mini Seminar Hall", floorId: "mb-f5", roomId: "mini-seminar", building: "Main Building", floorLabel: "Floor 5" },
  { id: "seminar-hall", name: "Seminar Hall", floorId: "sheds", roomId: "seminar-hall", building: "Campus Sheds", floorLabel: "Ground Level" },
  { id: "innovation-center", name: "Innovation Center (AIC)", floorId: "fb-f2", roomId: "innov", building: "Fisheries Block", floorLabel: "Floor 2" },
  { id: "dining-room", name: "Dining Room", floorId: "sheds", roomId: "shed4-dining", building: "Campus Sheds", floorLabel: "Ground Level" },
  { id: "ground-floor-corridor", name: "Ground Floor Corridor", floorId: "mb-gf", roomId: "free-space-1", building: "Main Building", floorLabel: "Ground Floor", isPublicPath: true },
];

/** Corridors and stairs are mapped as paths so they can be selected as destinations.
 * Path rooms are ignored while checking a route passing through them; their policy
 * applies when the path itself is the requested destination.
 */
const mappedPathLocations: SecurityLocation[] = Object.values(allFloorPlans)
  .filter((plan) => plan.id !== "campus")
  .flatMap((plan) => plan.rooms
    .filter((room) => room.type === "corridor" || room.type === "stairs" || room.type === "lift" || (plan.id === "mb-gf" && room.id === "free-space-2"))
    .map((room) => {
      const isPath = room.type === "corridor" || room.type === "stairs" || room.type === "open";
      const building = plan.id.startsWith("mb-")
        ? "Main Building"
        : plan.id.startsWith("fb-")
          ? "Fisheries Block"
          : plan.id.startsWith("bb-")
            ? "B Block"
            : "Campus Sheds";
      const floorLabel = plan.id.endsWith("-gf")
        ? "Ground Floor"
        : plan.id === "sheds"
          ? "Ground Level"
          : plan.title.replace(/^.*—\s*/, "");
      const kind = room.type === "stairs" ? "Stairs" : room.type === "lift" ? "Lift" : "Corridor";
      return {
        id: `path:${plan.id}:${room.id}`,
        name: `${kind} · ${plan.title}`,
        floorId: plan.id,
        roomId: room.id,
        building,
        floorLabel,
        isPublicPath: isPath,
      };
    }));

// Preserve existing IDs used by stored camera and visitor records.
export const securityLocations: SecurityLocation[] = [
  ...fixedLocations,
  ...officeLocations.filter((office) => !fixedLocations.some((location) => location.id === office.id)),
  ...mappedPathLocations.filter((path) => !fixedLocations.some((location) => location.floorId === path.floorId && location.roomId === path.roomId)),
];

export const locationById = (id: string) => securityLocations.find((location) => location.id === id);

export const cameras: Camera[] = [
  { id: "CAM-01", name: "CAM-01", locationId: "main-gate", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
  { id: "CAM-02", name: "CAM-02", locationId: "reception", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
  { id: "CAM-03", name: "CAM-03", locationId: "cse-lab", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
  { id: "CAM-04", name: "CAM-04", locationId: "staff-room", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
  { id: "CAM-05", name: "CAM-05", locationId: "library", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
  { id: "CAM-06", name: "CAM-06", locationId: "placement-cell", status: "online", source: "simulated", ipAddress: "", streamUrl: "" },
];

const officeIds = officeLocations.map((location) => location.id);
const staircaseIds = mappedPathLocations
  .filter((location) => location.name.startsWith("Stairs"))
  .map((location) => location.id);
const mainGroundFloorCorridorIds = mappedPathLocations
  .filter((location) => location.floorId === "mb-gf" && location.name.startsWith("Corridor"))
  .map((location) => location.id);
const mainGroundFloorOpenSpaceIds = mappedPathLocations
  .filter((location) => location.floorId === "mb-gf" && location.roomId === "free-space-2")
  .map((location) => location.id);
const recruiterOnlyIds = ["innovation-center", "dining-room"];
const seminarIds = ["mini-seminar-hall", "seminar-hall"];
const allowByType: Record<PersonType, string[]> = {
  Parent: [
    "main-gate",
    "ground-floor-corridor",
    ...mainGroundFloorCorridorIds,
    ...mainGroundFloorOpenSpaceIds,
    "canteen",
    ...officeIds,
    ...staircaseIds,
  ],
  Recruiter: [
    "main-gate",
    ...mainGroundFloorOpenSpaceIds,
    "canteen",
    "library",
    ...officeIds,
    ...seminarIds,
    ...recruiterOnlyIds,
    ...staircaseIds,
  ],
  "Product/Business Visitor": [
    "main-gate",
    "ground-floor-corridor",
    ...mainGroundFloorCorridorIds,
    ...mainGroundFloorOpenSpaceIds,
    "canteen",
    ...officeIds,
    ...seminarIds,
    ...staircaseIds,
  ],
  "Inspirational/Motivational Visitor": [
    "main-gate",
    "ground-floor-corridor",
    ...mainGroundFloorCorridorIds,
    ...mainGroundFloorOpenSpaceIds,
    "canteen",
    ...officeIds,
    ...seminarIds,
    ...staircaseIds,
  ],
  "Faculty/Staff": securityLocations.map((location) => location.id),
  "General Visitor": [
    "main-gate",
    "ground-floor-corridor",
    ...mainGroundFloorCorridorIds,
    ...mainGroundFloorOpenSpaceIds,
    "canteen",
    ...officeIds,
    ...seminarIds,
    ...staircaseIds,
  ],
};

// Parent Library is intentionally off by default. Security/Admin can enable this
// existing access-rule switch during the admissions period and turn it off after.
export const admissionsOnlyRuleId = "Parent:library";

export const defaultRules: AccessRule[] = securityLocations.flatMap((location) =>
  personTypes.map((type) => ({
    id: `${type}:${location.id}`,
    personType: type,
    locationId: location.id,
    allowed: allowByType[type].includes(location.id),
  }))
);

export const seedVisitors: Visitor[] = [
  {
    id: "VIS-1019",
    name: "Anita Sharma",
    email: "anita.sharma@example.com",
    mobile: "9000000011",
    type: "Recruiter",
    visiting: "Placement Officer",
    purpose: "Campus recruitment drive",
    authorizedLocationId: "placement-cell",
    expectedExit: "16:00",
    checkIn: Date.now() - 1000 * 60 * 50,
    status: "Active",
    verified: true,
    returning: false,
  },
];
