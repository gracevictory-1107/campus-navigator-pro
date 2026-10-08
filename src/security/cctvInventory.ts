import type { Camera } from "./types";

export type CctvEvidenceStatus = "identified" | "unlabeled";
export type CctvMappingConfidence = "confirmed" | "area-confirmed" | "floor-unconfirmed";

export interface CctvEvidence {
  id: string;
  building: "Main Building" | "Block B" | "Campus / Common Area";
  floorId?: string;
  floorLabel?: string;
  area: string;
  cameraLabel: string;
  sourceFile: string;
  status: CctvEvidenceStatus;
  confidence: CctvMappingConfidence;
  notes?: string;
}

/**
 * CCTV evidence collected from the college export on 2026-10-06/07.
 * This is an evidence inventory, not a claim that every file is a unique camera.
 * Exact floor/room is only assigned where the label itself or the current map
 * provides enough evidence. Unlabeled exports are intentionally not guessed.
 */
export const cctvEvidence: CctvEvidence[] = [
  // Main Building / library and common areas
  { id: "mb-lib-1", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 1", sourceFile: "Awdc-Library_KKD_W_Library cam1", status: "identified", confidence: "confirmed" },
  { id: "mb-lib-2", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 2", sourceFile: "Awdc-Library_KKD_W_Library cam2", status: "identified", confidence: "confirmed" },
  { id: "mb-lib-3", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 3", sourceFile: "Awdc-Library_KKD_W_Library cam3", status: "identified", confidence: "confirmed" },
  { id: "mb-lib-4", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 4", sourceFile: "Awdc-Library_KKD_W_Library cam4", status: "identified", confidence: "confirmed" },
  { id: "mb-lib-5", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 5", sourceFile: "Awdc-Library_KKD_W_Library cam5", status: "identified", confidence: "confirmed" },
  { id: "mb-lib-6", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library", cameraLabel: "Library Cam 6", sourceFile: "Awdc-Library_KKD_W_Library cam6", status: "identified", confidence: "confirmed" },
  { id: "mb-bus-in", building: "Campus / Common Area", area: "Bus Gate", cameraLabel: "Bus Gate IN", sourceFile: "Awdc-Library_Bus Gate IN", status: "identified", confidence: "area-confirmed" },
  { id: "mb-bus-out", building: "Campus / Common Area", area: "Bus Gate", cameraLabel: "Bus Gate OUT", sourceFile: "Awdc-Library_Bus Gate Out", status: "identified", confidence: "area-confirmed", notes: "Two exports exist for this labelled view; treated as evidence captures, not two unique cameras." },
  { id: "mb-east-gate", building: "Campus / Common Area", area: "Back East Side Gate", cameraLabel: "Back East Side Gate View", sourceFile: "Awdc-Library_KKD_W_BACK EAST SIDE GATE VIEW", status: "identified", confidence: "area-confirmed" },
  { id: "mb-west-gate", building: "Campus / Common Area", area: "Back West Side Gate", cameraLabel: "Back West Side Gate View", sourceFile: "Awdc-Library_KKD_W_BACK WEST SIDE GATE VIEW", status: "identified", confidence: "area-confirmed" },
  { id: "mb-seminar-out", building: "Campus / Common Area", area: "Main Seminar exterior", cameraLabel: "Main Seminar Outside", sourceFile: "Awdc-Library_KKD_W_MAIN SEMINAR OUT SIDE", status: "identified", confidence: "area-confirmed" },
  { id: "mb-stage", building: "Campus / Common Area", area: "Stage / open area", cameraLabel: "Stage View", sourceFile: "Awdc-Library_KKD_W_STAGE_VIEW", status: "identified", confidence: "area-confirmed" },
  { id: "mb-store-1", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library / storage area", cameraLabel: "Store Room Cam 1", sourceFile: "Awdc-Library_KKD_W_Sotre room cam1", status: "identified", confidence: "floor-unconfirmed", notes: "Ground-floor association is inferred from the adjacent library evidence; exact room mapping awaits campus survey cross-check." },
  { id: "mb-store-2", building: "Main Building", floorId: "mb-gf", floorLabel: "Ground Floor", area: "Library / storage area", cameraLabel: "Store Room Cam 2", sourceFile: "Awdc-Library_KKD_W_Sotre room cam2", status: "identified", confidence: "floor-unconfirmed", notes: "Ground-floor association is inferred from the adjacent library evidence; exact room mapping awaits campus survey cross-check." },

  // Main Building / named floor and lab views
  { id: "mb-f3-view", building: "Main Building", floorId: "mb-f3", floorLabel: "Floor 3", area: "Floor 3 common/corridor view", cameraLabel: "Floor 3", sourceFile: "MainGATE_AWDC_KKD_FLOOR 3", status: "identified", confidence: "confirmed" },
  { id: "mb-f4-view", building: "Main Building", floorId: "mb-f4", floorLabel: "Floor 4", area: "Floor 4 common/corridor view", cameraLabel: "Floor 4", sourceFile: "MainGATE_AWDC_KKD_FLOOR 4", status: "identified", confidence: "confirmed" },
  { id: "mb-f5-view", building: "Main Building", floorId: "mb-f5", floorLabel: "Floor 5", area: "Floor 5 common/corridor view", cameraLabel: "Floor 5", sourceFile: "MainGATE_AWDC_KKD_FLOOR 5", status: "identified", confidence: "confirmed" },
  { id: "mb-air-2", building: "Main Building", floorId: "mb-f2", floorLabel: "Floor 2", area: "AI & R Lab", cameraLabel: "AI & R Lab Cam 2", sourceFile: "MainGATE_KKD_W_AI&R LAB -CAM2", status: "identified", confidence: "confirmed" },
  { id: "mb-life-1", building: "Main Building", floorId: "mb-f2", floorLabel: "Floor 2", area: "Life Sciences Lab", cameraLabel: "Life Science Cam 1", sourceFile: "MainGATE_KKD_W_LIFE SCIENCE CAM1", status: "identified", confidence: "confirmed" },
  { id: "mb-life-2", building: "Main Building", floorId: "mb-f2", floorLabel: "Floor 2", area: "Life Sciences Lab", cameraLabel: "Life Science Cam 2", sourceFile: "MainGATE_KKD_W_LIFE SCIENCE CAM2", status: "identified", confidence: "confirmed" },
  { id: "mb-chem-2", building: "Main Building", floorId: "mb-f2", floorLabel: "Floor 2", area: "Chemistry Lab", cameraLabel: "Chemistry Lab Cam 2", sourceFile: "MainGATE_Awdc_Kkd_Chemistry Lab cam2", status: "identified", confidence: "confirmed" },
  { id: "mb-comp6-1", building: "Main Building", area: "Computer Lab 6", cameraLabel: "Computer Lab 6 Cam 1", sourceFile: "MainGATE_KKD_W_Computer lab 6_cam1", status: "identified", confidence: "area-confirmed", notes: "Exact floor is intentionally left unassigned because the export label does not state it." },
  { id: "mb-comp6-2", building: "Main Building", area: "Computer Lab 6", cameraLabel: "Computer Lab 6 Cam 2", sourceFile: "MainGATE_KKD_W_Computer lab 6_cam2", status: "identified", confidence: "area-confirmed", notes: "Exact floor is intentionally left unassigned because the export label does not state it." },
  { id: "mb-comp7-1", building: "Main Building", area: "Computer Lab 7", cameraLabel: "Computer Lab 7 Cam 1", sourceFile: "MainGATE_KKD_W_Computer lab 7_cam1", status: "identified", confidence: "area-confirmed", notes: "Exact floor is intentionally left unassigned because the export label does not state it." },
  { id: "mb-comp7-2", building: "Main Building", area: "Computer Lab 7", cameraLabel: "Computer Lab 7 Cam 2", sourceFile: "MainGATE_KKD_W_Computer lab 7_cam2", status: "identified", confidence: "area-confirmed", notes: "Exact floor is intentionally left unassigned because the export label does not state it." },
  { id: "mb-comp8", building: "Main Building", area: "Computer Lab 8", cameraLabel: "Computer Lab 8", sourceFile: "MainGATE_AWDCKKD-COMPUTER LAB 8", status: "identified", confidence: "area-confirmed", notes: "Exact floor is intentionally left unassigned because the export label does not state it." },
  { id: "mb-parking", building: "Campus / Common Area", area: "Parking", cameraLabel: "Parking", sourceFile: "MainGATE_KKD_W_PARKING", status: "identified", confidence: "area-confirmed" },

  // Office / seminar group
  { id: "office-1", building: "Main Building", area: "Office / Seminars", cameraLabel: "Camera 01", sourceFile: "OFFICE AND SEMINARS_Camera 01", status: "identified", confidence: "area-confirmed" },
  { id: "office-dtp", building: "Main Building", area: "DTP Cabin", cameraLabel: "DTP Cabin", sourceFile: "OFFICE AND SEMINARS_KKD_W_DTP CABIN", status: "identified", confidence: "area-confirmed" },
  { id: "office-gate-in", building: "Campus / Common Area", area: "Main Gate", cameraLabel: "Main Gate IN", sourceFile: "OFFICE AND SEMINARS_Main gate IN", status: "identified", confidence: "area-confirmed" },

  // Block B
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `bb-aic-${index + 1}`,
    building: "Block B" as const,
    area: "AIC",
    cameraLabel: `AIC Cam ${index + 1}`,
    sourceFile: `Block B  AIC_AIC CAM ${index + 1}_Block B  AIC`,
    status: "identified" as const,
    confidence: "area-confirmed" as const,
    notes: "AIC camera label is confirmed by the CCTV export; exact floor/room is awaiting floor cross-check.",
  })),
  { id: "bb-f2-staff", building: "Block B", floorLabel: "Floor 2", area: "Staff Room Corridor", cameraLabel: "Floor 2 Staff Room Corridor", sourceFile: "Block B  AIC_Floor 2 Staff room corridor", status: "identified", confidence: "confirmed", notes: "CCTV evidence confirms a Block B Floor 2 view; the current navigation model does not yet contain a Block B Floor 2 floor plan." },
  { id: "bb-f2-stairs", building: "Block B", floorLabel: "Floor 2", area: "Stairs", cameraLabel: "Floor 2 Stairs", sourceFile: "Block B  AIC_Floor 2 Stairs", status: "identified", confidence: "confirmed", notes: "CCTV evidence confirms a Block B Floor 2 view; the current navigation model does not yet contain a Block B Floor 2 floor plan." },
  { id: "bb-f3-c1", building: "Block B", floorId: "bb-f3", floorLabel: "Floor 3", area: "Corridor", cameraLabel: "Floor 3 Corridor Cam 1", sourceFile: "Block B  AIC_Floor 3 Corridor cam1", status: "identified", confidence: "confirmed" },
  { id: "bb-f3-c2", building: "Block B", floorId: "bb-f3", floorLabel: "Floor 3", area: "Corridor", cameraLabel: "Floor 3 Corridor Cam 2", sourceFile: "Block B  AIC_Floor 3 Corridor cam2", status: "identified", confidence: "confirmed" },
  { id: "bb-f3-staff", building: "Block B", floorId: "bb-f3", floorLabel: "Floor 3", area: "Staff Room Corridor", cameraLabel: "Floor 3 Staff Room Corridor", sourceFile: "Block B  AIC_Floor 3 Staff room corridor", status: "identified", confidence: "confirmed" },
  { id: "bb-f3-stairs", building: "Block B", floorId: "bb-f3", floorLabel: "Floor 3", area: "Stairs", cameraLabel: "Floor 3 Stairs", sourceFile: "Block B  AIC_Floor 3 stairs", status: "identified", confidence: "confirmed" },
  { id: "bb-f3-wc", building: "Block B", floorId: "bb-f3", floorLabel: "Floor 3", area: "Washroom Corridor", cameraLabel: "Floor 3 Washroom Corridor", sourceFile: "Block B  AIC_Floor3 Washroom Corridor", status: "identified", confidence: "confirmed" },
] satisfies CctvEvidence[];

/**
 * The two exports contain 109 CCTV captures in total:
 * 59 from the Main Building export and 50 from the Block B export.
 * These are evidence captures, not a verified unique-camera count.
 */
export const cctvEvidenceCaptureCounts = {
  mainBuilding: 59,
  blockB: 50,
  total: 109,
};

export const identifiedCctvEvidence = cctvEvidence.filter((item) => item.status === "identified");

export const cctvEvidenceFloorGroups = [
  { building: "Main Building", floorId: "mb-gf", label: "Ground Floor" },
  { building: "Main Building", floorId: "mb-f1", label: "Floor 1" },
  { building: "Main Building", floorId: "mb-f2", label: "Floor 2" },
  { building: "Main Building", floorId: "mb-f3", label: "Floor 3" },
  { building: "Main Building", floorId: "mb-f4", label: "Floor 4" },
  { building: "Main Building", floorId: "mb-f5", label: "Floor 5" },
  { building: "Block B", floorId: "bb-f2", label: "Floor 2 (CCTV evidence; plan pending)" },
  { building: "Block B", floorId: "bb-f3", label: "Floor 3" },
  { building: "Block B", floorId: "bb-f4", label: "Floor 4" },
  { building: "Block B", floorId: "bb-f5", label: "Floor 5" },
];
