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

  // Main Building / additional labelled stills reviewed on 2026-10-09.
  // These are catalogued views from the existing export set and are not added again to the aggregate capture count.
  { id: "mb-seminar-hall", building: "Main Building", area: "Seminar Hall", cameraLabel: "Seminar Hall View", sourceFile: "On-screen label: Seminar hall view", status: "identified", confidence: "floor-unconfirmed", notes: "Room view is clear; exact floor and physical room ID are not confirmed by this frame alone." },
  { id: "mb-mini-seminar-1", building: "Main Building", area: "Mini Seminar Hall", cameraLabel: "Mini Seminar Cam 1", sourceFile: "On-screen label: Mini Seminar cam 1", status: "identified", confidence: "floor-unconfirmed", notes: "Mini Seminar camera view; floor and room ID await a floor-plan cross-check." },
  { id: "mb-mini-seminar-2", building: "Main Building", area: "Mini Seminar Hall", cameraLabel: "Mini Seminar Cam 2", sourceFile: "On-screen label: Mini Seminar cam 2", status: "identified", confidence: "floor-unconfirmed", notes: "Mini Seminar camera view; floor and room ID await a floor-plan cross-check." },
  { id: "mb-seminar-stage", building: "Main Building", area: "Seminar Hall Stage", cameraLabel: "Seminar Stage View", sourceFile: "On-screen label: Seminar stage view", status: "identified", confidence: "floor-unconfirmed", notes: "Interior stage/lectern view; kept separate from the already-listed general Stage View because the exact camera identity is not confirmed." },
  { id: "mb-comp3-1", building: "Main Building", area: "Computer Lab 3", cameraLabel: "Computer Lab 3 Cam 1", sourceFile: "On-screen label: KKD_W_Computer lab3_cam1", status: "identified", confidence: "area-confirmed", notes: "Computer Lab 3 is labelled; exact floor and room ID are not shown." },
  { id: "mb-comp1-2", building: "Main Building", area: "Computer Lab 1", cameraLabel: "Computer Lab 1 Cam 2", sourceFile: "On-screen label: KKD_W_Computer lab1_cam2", status: "identified", confidence: "area-confirmed", notes: "Computer Lab 1 is labelled; exact floor and room ID are not shown." },
  { id: "mb-comp3-2", building: "Main Building", area: "Computer Lab 3", cameraLabel: "Computer Lab 3 Cam 2", sourceFile: "On-screen label: KKD_W_Computer lab3_cam2", status: "identified", confidence: "area-confirmed", notes: "Computer Lab 3 is labelled; exact floor and room ID are not shown. Camera 1 and Camera 2 are kept as separate labelled views." },
  { id: "mb-electronics-unknown", building: "Main Building", area: "Electronics Lab", cameraLabel: "Electronics Lab Camera (number unconfirmed)", sourceFile: "On-screen label clipped: KKD_W_Electronics lab_ca…", status: "identified", confidence: "area-confirmed", notes: "Electronics Lab is readable but the remainder of the camera label is clipped; camera number and floor are intentionally not inferred." },
  { id: "mb-comp4-2", building: "Main Building", area: "Computer Lab 4", cameraLabel: "Computer Lab 4 Cam 2", sourceFile: "On-screen label: KKD_W_Computer lab4_cam2", status: "identified", confidence: "area-confirmed", notes: "Computer Lab 4 is labelled; exact floor and room ID are not shown." },
  { id: "mb-comp2-1", building: "Main Building", area: "Computer Lab 2", cameraLabel: "Computer Lab 2 Cam 1", sourceFile: "On-screen label: KKD_W_Computer lab2_cam1", status: "identified", confidence: "area-confirmed", notes: "Computer Lab 2 is labelled; exact floor and room ID are not shown." },
  { id: "mb-ai-smart-1", building: "Main Building", area: "AI Smart Lab", cameraLabel: "AI Smart Lab Cam 1", sourceFile: "On-screen label: KKD_W_AI SMART LAB_cam1", status: "identified", confidence: "area-confirmed", notes: "AI Smart Lab is labelled; kept separate from AI & R Lab Cam 2 until the college confirms whether these are the same room." },
  { id: "mb-floor-corridor-ambiguous", building: "Main Building", area: "Floor Corridor (label ambiguous)", cameraLabel: "Corridor View (floor unconfirmed)", sourceFile: "On-screen label: KKD_W_1 II FLOOR CORRIDOR", status: "identified", confidence: "floor-unconfirmed", notes: "The floor portion of the overlay is ambiguous in the supplied still; no floor is assigned." },
  { id: "mb-f1-corridor", building: "Main Building", floorId: "mb-f1", floorLabel: "First Floor", area: "First Floor Corridor", cameraLabel: "First Floor Corridor", sourceFile: "On-screen label: KKD_W_1st Floor Corridor", status: "identified", confidence: "confirmed", notes: "First-floor corridor is explicit in the on-screen label; room-level anchor is not assigned." },
  { id: "campus-playing-area", building: "Campus / Common Area", area: "Playing Area", cameraLabel: "Playing Area", sourceFile: "On-screen label: KKD_W_Playing Area", status: "identified", confidence: "area-confirmed", notes: "Outdoor playing area view; not assigned to an indoor floor." },

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
