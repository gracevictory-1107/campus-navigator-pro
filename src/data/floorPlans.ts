export type RoomType =
  | "lab" | "class" | "hod" | "stairs" | "lift" | "wc"
  | "exit" | "corridor" | "staff" | "innov" | "open"
  | "canteen" | "dean" | "court";

export interface Room {
  id: string;
  label: string;
  sublabel?: string;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  description?: string;
}

export interface FloorPlan {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  svgWidth: number;
  svgHeight: number;
  rooms: Room[];
  labels?: { text: string; x: number; y: number; color: "cyan" | "green" | "amber"; anchor?: string; rotate?: number }[];
}

export interface BuildingSection {
  name: string;
  icon: string;
  floors: { id: string; label: string; code: string }[];
}

export const buildingSections: BuildingSection[] = [
  {
    name: "OVERVIEW",
    icon: "⊕",
    floors: [{ id: "campus", label: "Campus Map", code: "99" }],
  },
  {
    name: "MAIN BUILDING",
    icon: "▦",
    floors: [
      { id: "mb-gf", label: "Ground Floor", code: "00" },
      { id: "mb-f1", label: "Floor 1", code: "01" },
      { id: "mb-f2", label: "Floor 2", code: "02" },
      { id: "mb-f3", label: "Floor 3", code: "03" },
      { id: "mb-f4", label: "Floor 4", code: "04" },
      { id: "mb-f5", label: "Floor 5", code: "05" },
    ],
  },
  {
    name: "FISHERIES BLOCK",
    icon: "◈",
    floors: [
      { id: "fb-gf", label: "Ground Floor", code: "10" },
      { id: "fb-f1", label: "Floor 1", code: "11" },
      { id: "fb-f2", label: "Floor 2", code: "12" },
    ],
  },
  {
    name: "B BLOCK",
    icon: "◧",
    floors: [
      { id: "bb-f3", label: "Floor 3", code: "13" },
      { id: "bb-f4", label: "Floor 4", code: "14" },
      { id: "bb-f5", label: "Floor 5", code: "15" },
    ],
  },
  {
    name: "CAMPUS",
    icon: "⬡",
    floors: [{ id: "sheds", label: "Sheds", code: "90" }],
  },
];

// =================== CAMPUS OVERVIEW ===================
const campusOverview: FloorPlan = {
  id: "campus",
  title: "CAMPUS OVERVIEW",
  subtitle: "TOP-DOWN · ALL BLOCKS",
  code: "99",
  svgWidth: 820,
  svgHeight: 640,
  rooms: [
    { id: "fb", label: "FISHERIES BLOCK", sublabel: "(horizontal)", type: "hod", x: 20, y: 45, w: 175, h: 100, description: "Fisheries Block — GF+F1+F2" },
    { id: "aqua", label: "AQUARIUMS", sublabel: "COURTYARD", type: "open", x: 20, y: 147, w: 175, h: 285 },
    { id: "mb", label: "MAIN BLDG", sublabel: "GF – F5", type: "class", x: 200, y: 45, w: 112, h: 387, description: "Main Building — GF to F5" },
    { id: "open-space", label: "Open Space", type: "corridor", x: 200, y: 434, w: 112, h: 76 },
    { id: "canteen", label: "CANTEEN", type: "canteen", x: 200, y: 512, w: 112, h: 78 },
    { id: "corr1", label: "CORRIDOR 1", type: "corridor", x: 316, y: 45, w: 40, h: 545, description: "Corridor 1 — Entry 1 to Exit 1" },
    { id: "entry1", label: "ENTRY 1", type: "exit", x: 316, y: 28, w: 40, h: 15 },
    { id: "exit1", label: "EXIT 1", type: "exit", x: 316, y: 593, w: 40, h: 15 },
    { id: "open-stage", label: "OPEN STAGE", type: "open", x: 360, y: 45, w: 72, h: 545 },
    { id: "open-ground", label: "OPEN GROUND", type: "open", x: 434, y: 45, w: 72, h: 545 },
    { id: "badminton", label: "BADMINTON", type: "court", x: 508, y: 45, w: 72, h: 545 },
    { id: "shed1", label: "SHED 1", type: "class", x: 584, y: 45, w: 30, h: 181 },
    { id: "shed2", label: "SHED 2", type: "class", x: 584, y: 226, w: 30, h: 181 },
    { id: "shed3", label: "SHED 3", type: "class", x: 584, y: 407, w: 30, h: 183 },
    { id: "corr2", label: "CORRIDOR 2", type: "corridor", x: 618, y: 45, w: 40, h: 545 },
    { id: "entry2", label: "ENTRY 2", type: "exit", x: 618, y: 28, w: 40, h: 15 },
    { id: "exit2", label: "EXIT 2", type: "exit", x: 618, y: 593, w: 40, h: 15 },
    { id: "shed4", label: "SHED 4 — VERTICAL", type: "hod", x: 662, y: 45, w: 110, h: 545 },
  ],
  labels: [
    { text: "▲ MAIN ENTRY", x: 40, y: 35, color: "green" },
    { text: "▲ ENTRY 1", x: 336, y: 35, color: "green", anchor: "middle" },
    { text: "▲ ENTRY 2", x: 641, y: 35, color: "green", anchor: "middle" },
  ],
};

// =================== MB GROUND FLOOR (UPDATED per image) ===================
const mbGroundFloor: FloorPlan = {
  id: "mb-gf",
  title: "MAIN BUILDING — GROUND FLOOR",
  subtitle: "Administration · Library",
  code: "00",
  svgWidth: 540,
  svgHeight: 720,
  rooms: [
    // Top row
    { id: "principal", label: "Principal", sublabel: "Office", type: "hod", x: 20, y: 22, w: 130, h: 70, description: "Principal Office" },
    { id: "director", label: "Director", sublabel: "Room", type: "class", x: 152, y: 22, w: 80, h: 70, description: "Director Room" },
    { id: "lift", label: "Lift", type: "lift", x: 234, y: 22, w: 56, h: 70 },
    { id: "cash", label: "Cash", sublabel: "Counters", type: "class", x: 340, y: 22, w: 100, h: 34, description: "Cash Counters" },
    { id: "main-entrance", label: "Main", sublabel: "Entrance", type: "exit", x: 442, y: 22, w: 78, h: 34, description: "Main Entrance" },
    // Admin desk
    { id: "admin-desk", label: "Administrative", sublabel: "Desk", type: "class", x: 340, y: 58, w: 180, h: 34, description: "Administrative Desk" },
    // Board room (left, large)
    { id: "board-room", label: "Board Room", type: "class", x: 20, y: 94, w: 130, h: 100, description: "Board Room" },
    // Vice principal + Help desk
    { id: "vp-cabin", label: "Vice Principal", sublabel: "Cabin", type: "hod", x: 310, y: 134, w: 100, h: 60, description: "Vice Principal Cabin" },
    { id: "help-desk", label: "Help", sublabel: "Desk", type: "class", x: 412, y: 134, w: 78, h: 60, description: "Help Desk" },
    // Free space between top row and VP area
    { id: "free-space-1", label: "", type: "corridor", x: 152, y: 94, w: 156, h: 100 },
    // Office back door + Office desk
    { id: "office-back", label: "Office", sublabel: "Back door", type: "exit", x: 230, y: 250, w: 100, h: 40, description: "Office Back Door" },
    { id: "office-desk", label: "Office Desk", type: "class", x: 332, y: 250, w: 100, h: 40, description: "Office Desk" },
    // Free space
    { id: "free-space-2", label: "", type: "corridor", x: 20, y: 196, w: 500, h: 52 },
    // Staircases
    { id: "stair-l", label: "Stairs", type: "stairs", x: 20, y: 320, w: 180, h: 120, description: "Left Staircase" },
    { id: "stair-r", label: "Stairs", type: "stairs", x: 300, y: 320, w: 180, h: 120, description: "Right Staircase" },
    // Corridor between stairs
    { id: "corr-mid", label: "", type: "corridor", x: 202, y: 320, w: 96, h: 120 },
    // Library back door
    { id: "lib-back", label: "Library Back Door", type: "exit", x: 170, y: 442, w: 160, h: 30, description: "Library Back Door" },
    // Library
    { id: "library", label: "Library", type: "class", x: 20, y: 474, w: 500, h: 180, description: "Library" },
    // Library main entrance
    { id: "lib-entrance", label: "Library Main Entrance", type: "exit", x: 170, y: 656, w: 160, h: 30, description: "Library Main Entrance" },
  ],
  labels: [
    { text: "▲ FRONT / MAIN ENTRANCE", x: 270, y: 14, color: "green", anchor: "middle" },
    { text: "▼ LIBRARY ENTRANCE", x: 270, y: 700, color: "amber", anchor: "middle" },
  ],
};

// =================== MB FLOOR 1 ===================
const mbFloor1: FloorPlan = {
  id: "mb-f1",
  title: "MAIN BUILDING — FLOOR 1",
  subtitle: "Computer Labs",
  code: "01",
  svgWidth: 460,
  svgHeight: 520,
  rooms: [
    { id: "ladies-staff", label: "Ladies Staff Room", type: "staff", x: 20, y: 22, w: 180, h: 60 },
    { id: "lift", label: "Lift", type: "lift", x: 20, y: 84, w: 180, h: 60 },
    { id: "comp1", label: "Computer Lab 1", type: "lab", x: 20, y: 146, w: 180, h: 100 },
    { id: "stair-l", label: "Staircase (L)", type: "stairs", x: 20, y: 248, w: 180, h: 70 },
    { id: "comp3", label: "Computer Lab 3", type: "lab", x: 20, y: 320, w: 180, h: 100 },
    { id: "ladies-wc", label: "Ladies Washroom", type: "wc", x: 20, y: 422, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 470 },
    { id: "mens-staff", label: "Men's Staff Room", type: "staff", x: 260, y: 22, w: 180, h: 60 },
    { id: "comp2", label: "Computer Lab 2", type: "lab", x: 260, y: 84, w: 180, h: 164 },
    { id: "stair-r", label: "Staircase (R)", type: "stairs", x: 260, y: 248, w: 180, h: 70 },
    { id: "comp4", label: "Computer Lab 4", type: "lab", x: 260, y: 320, w: 180, h: 100 },
    { id: "mens-wc", label: "Men's Washroom", type: "wc", x: 260, y: 422, w: 180, h: 70 },
  ],
  labels: [
    { text: "▲ FRONT", x: 230, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 230, y: 510, color: "amber", anchor: "middle" },
  ],
};

// =================== MB FLOOR 2 ===================
const mbFloor2: FloorPlan = {
  id: "mb-f2",
  title: "MAIN BUILDING — FLOOR 2",
  subtitle: "Science Labs",
  code: "02",
  svgWidth: 460,
  svgHeight: 520,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 180, h: 60 },
    { id: "lift", label: "Lift", type: "lift", x: 20, y: 84, w: 180, h: 60 },
    { id: "air-lab", label: "AI & R Lab", type: "lab", x: 20, y: 146, w: 180, h: 100 },
    { id: "stair-l", label: "Staircase (L)", type: "stairs", x: 20, y: 248, w: 180, h: 70 },
    { id: "life-sci", label: "Life Sciences Lab", type: "lab", x: 20, y: 320, w: 180, h: 100 },
    { id: "ladies-wc", label: "Ladies Washroom", type: "wc", x: 20, y: 422, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 470 },
    { id: "hod", label: "HOD Room", type: "hod", x: 260, y: 22, w: 180, h: 60 },
    { id: "ai-lab", label: "AI Lab", type: "lab", x: 260, y: 84, w: 180, h: 164 },
    { id: "stair-r", label: "Staircase (R)", type: "stairs", x: 260, y: 248, w: 180, h: 70 },
    { id: "chem-lab", label: "Chemistry Lab", type: "lab", x: 260, y: 320, w: 180, h: 100 },
    { id: "mens-wc", label: "Men's Washroom", type: "wc", x: 260, y: 422, w: 180, h: 70 },
  ],
  labels: [
    { text: "▲ FRONT", x: 230, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 230, y: 510, color: "amber", anchor: "middle" },
  ],
};

// =================== MB FLOOR 3 ===================
const mbFloor3: FloorPlan = {
  id: "mb-f3",
  title: "MAIN BUILDING — FLOOR 3",
  subtitle: "Electronics · GD Rooms",
  code: "03",
  svgWidth: 460,
  svgHeight: 580,
  rooms: [
    { id: "hod", label: "HOD Room", type: "hod", x: 20, y: 22, w: 180, h: 58 },
    { id: "lift", label: "Lift", type: "lift", x: 20, y: 82, w: 180, h: 58 },
    { id: "elec-a", label: "Electronics Lab A", type: "lab", x: 20, y: 142, w: 180, h: 58 },
    { id: "elec-b", label: "Electronics Lab B", type: "lab", x: 20, y: 202, w: 180, h: 58 },
    { id: "stair-l", label: "Staircase (L)", type: "stairs", x: 20, y: 262, w: 180, h: 60 },
    { id: "coe", label: "Controller of Examinations", type: "class", x: 20, y: 324, w: 180, h: 68 },
    { id: "gd-l", label: "GD Room (L)", type: "class", x: 20, y: 394, w: 180, h: 68 },
    { id: "ladies-wc", label: "Ladies Washroom", type: "wc", x: 20, y: 464, w: 180, h: 80 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 522 },
    { id: "nss-a", label: "NSS Room A", type: "class", x: 260, y: 22, w: 180, h: 58 },
    { id: "nss-b", label: "NSS Room B", type: "class", x: 260, y: 82, w: 180, h: 58 },
    { id: "lab6", label: "Lab 6", type: "lab", x: 260, y: 142, w: 180, h: 58 },
    { id: "lab7", label: "Lab 7", type: "lab", x: 260, y: 202, w: 180, h: 58 },
    { id: "stair-r", label: "Staircase (R)", type: "stairs", x: 260, y: 262, w: 180, h: 60 },
    { id: "comm-lab", label: "Communication Lab", type: "lab", x: 260, y: 324, w: 180, h: 68 },
    { id: "gd-r", label: "GD Room (R)", type: "class", x: 260, y: 394, w: 180, h: 68 },
    { id: "store", label: "Store Room", type: "class", x: 260, y: 464, w: 180, h: 80 },
  ],
  labels: [
    { text: "▲ FRONT", x: 230, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 230, y: 564, color: "amber", anchor: "middle" },
  ],
};

// =================== MB FLOOR 4 ===================
const mbFloor4: FloorPlan = {
  id: "mb-f4",
  title: "MAIN BUILDING — FLOOR 4",
  subtitle: "II Year Classrooms",
  code: "04",
  svgWidth: 460,
  svgHeight: 560,
  rooms: [
    { id: "hod", label: "HOD Room", type: "hod", x: 20, y: 22, w: 180, h: 40 },
    { id: "lift", label: "Lift", type: "lift", x: 20, y: 64, w: 180, h: 40 },
    { id: "r23", label: "R23 — II BSc CS-2", type: "class", x: 20, y: 106, w: 180, h: 70 },
    { id: "r22", label: "R22 — II BSc CS-1", type: "class", x: 20, y: 178, w: 180, h: 70 },
    { id: "stair-l", label: "Staircase (L)", type: "stairs", x: 20, y: 250, w: 180, h: 70 },
    { id: "r29", label: "R29 — II BSc DS-2", type: "class", x: 20, y: 322, w: 180, h: 70 },
    { id: "r28", label: "R28 — BSc DS-1", type: "class", x: 20, y: 394, w: 180, h: 70 },
    { id: "ladies-wc", label: "Ladies Washroom", type: "wc", x: 20, y: 466, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 514 },
    { id: "staff", label: "Staff Room", type: "staff", x: 260, y: 22, w: 180, h: 80 },
    { id: "r24", label: "R24 — II BCA DS-2", type: "class", x: 260, y: 106, w: 180, h: 70 },
    { id: "r25", label: "R25 — II BSc CS-4", type: "class", x: 260, y: 178, w: 180, h: 70 },
    { id: "stair-r", label: "Staircase (R)", type: "stairs", x: 260, y: 250, w: 180, h: 70 },
    { id: "r26", label: "R26 — II BSc MBC", type: "class", x: 260, y: 322, w: 180, h: 70 },
    { id: "r27", label: "R27 — II BSc AIR", type: "class", x: 260, y: 394, w: 180, h: 70 },
    { id: "store", label: "Store Room", type: "class", x: 260, y: 466, w: 180, h: 70 },
  ],
  labels: [
    { text: "▲ FRONT", x: 230, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 230, y: 556, color: "amber", anchor: "middle" },
  ],
};

// =================== MB FLOOR 5 ===================
const mbFloor5: FloorPlan = {
  id: "mb-f5",
  title: "MAIN BUILDING — FLOOR 5",
  subtitle: "II Year · Mini Seminar Hall",
  code: "05",
  svgWidth: 460,
  svgHeight: 590,
  rooms: [
    { id: "hod", label: "HOD Room", type: "hod", x: 20, y: 22, w: 180, h: 60 },
    { id: "lift", label: "Lift", type: "lift", x: 20, y: 84, w: 180, h: 60 },
    { id: "r31", label: "R31 — II BCA DS-1", type: "class", x: 20, y: 146, w: 180, h: 60 },
    { id: "r30", label: "R30 — II BCA-2", type: "class", x: 20, y: 208, w: 180, h: 70 },
    { id: "stair-l", label: "Staircase (L)", type: "stairs", x: 20, y: 280, w: 180, h: 70 },
    { id: "r37", label: "R37 — II BCA-1", type: "class", x: 20, y: 352, w: 180, h: 70 },
    { id: "r36", label: "R36 — Empty", type: "class", x: 20, y: 424, w: 180, h: 60 },
    { id: "ladies-wc", label: "Ladies Washroom", type: "wc", x: 20, y: 486, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 534 },
    { id: "r32", label: "R32 — II BSc CS-3", sublabel: "(A + B sections)", type: "class", x: 260, y: 22, w: 180, h: 184 },
    { id: "r38", label: "R38", type: "class", x: 260, y: 208, w: 180, h: 70 },
    { id: "stair-r", label: "Staircase (R)", type: "stairs", x: 260, y: 280, w: 180, h: 70 },
    { id: "r34", label: "R34 — II BBA-DM", type: "class", x: 260, y: 352, w: 180, h: 70 },
    { id: "mini-seminar", label: "Mini Seminar Hall", type: "dean", x: 260, y: 424, w: 180, h: 132 },
  ],
  labels: [
    { text: "▲ FRONT", x: 230, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 230, y: 576, color: "amber", anchor: "middle" },
  ],
};

// =================== FB GROUND FLOOR ===================
const fbGroundFloor: FloorPlan = {
  id: "fb-gf",
  title: "FISHERIES BLOCK — GROUND FLOOR",
  subtitle: "Labs · Dean of Fisheries",
  code: "10",
  svgWidth: 580,
  svgHeight: 700,
  rooms: [
    { id: "entry", label: "ENTRY", type: "exit", x: 192, y: 14, w: 78, h: 14 },
    { id: "corridor", label: "CORRIDOR — FULL LENGTH", type: "corridor", x: 192, y: 30, w: 78, h: 632 },
    { id: "stairs", label: "Staircase", type: "stairs", x: 20, y: 30, w: 170, h: 82 },
    { id: "small-room", label: "[ small room ]", type: "class", x: 272, y: 30, w: 280, h: 82 },
    { id: "micro", label: "Microbiology Lab", type: "lab", x: 20, y: 114, w: 170, h: 82 },
    { id: "qc-a", label: "QC Lab — Section A", type: "lab", x: 272, y: 114, w: 280, h: 82 },
    { id: "elisa", label: "Elisa Lab", type: "lab", x: 20, y: 198, w: 170, h: 82 },
    { id: "qc-b", label: "QC Lab — Section B", type: "lab", x: 272, y: 198, w: 280, h: 82 },
    { id: "museum-a", label: "Museum (A)", type: "class", x: 20, y: 282, w: 170, h: 82 },
    { id: "pcr", label: "PCR Lab", type: "lab", x: 272, y: 282, w: 280, h: 82 },
    { id: "museum-b", label: "Museum (B)", type: "class", x: 20, y: 366, w: 170, h: 82 },
    { id: "feed", label: "Feed Lab", type: "lab", x: 272, y: 366, w: 280, h: 82 },
    { id: "dean", label: "Dean of Fisheries", type: "dean", x: 20, y: 450, w: 170, h: 164 },
    { id: "lift", label: "Lift", type: "lift", x: 272, y: 450, w: 280, h: 82 },
    { id: "wc", label: "Washroom", type: "wc", x: 272, y: 534, w: 280, h: 80 },
    { id: "exit", label: "EXIT", type: "exit", x: 192, y: 664, w: 78, h: 14 },
  ],
  labels: [
    { text: "▲ FRONT", x: 300, y: 10, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 300, y: 690, color: "amber", anchor: "middle" },
  ],
};

// =================== FB FLOOR 1 ===================
const fbFloor1: FloorPlan = {
  id: "fb-f1",
  title: "FISHERIES BLOCK — FLOOR 1",
  subtitle: "1st & 2nd Year Classes",
  code: "11",
  svgWidth: 580,
  svgHeight: 680,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 170, h: 88 },
    { id: "corridor", label: "CORRIDOR — FULL LENGTH", type: "corridor", x: 192, y: 22, w: 78, h: 624 },
    { id: "stairs", label: "Staircase", sublabel: "(2 rows)", type: "stairs", x: 20, y: 112, w: 170, h: 180 },
    { id: "room1", label: "Room 1", type: "class", x: 272, y: 112, w: 280, h: 88 },
    { id: "room2", label: "Room 2 — 2nd Year", type: "hod", x: 272, y: 202, w: 280, h: 90 },
    { id: "room4", label: "Room 4 — 1st Year", type: "hod", x: 20, y: 294, w: 170, h: 88 },
    { id: "room3", label: "Room 3", type: "class", x: 272, y: 294, w: 280, h: 88 },
    { id: "room5", label: "Room 5", type: "class", x: 20, y: 384, w: 170, h: 88 },
    { id: "lift", label: "Lift", type: "lift", x: 272, y: 384, w: 280, h: 88 },
    { id: "room6", label: "Room 6", type: "class", x: 20, y: 474, w: 170, h: 172 },
    { id: "wc", label: "Washrooms", type: "wc", x: 272, y: 474, w: 280, h: 172 },
  ],
  labels: [
    { text: "▲ FRONT", x: 300, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 300, y: 664, color: "amber", anchor: "middle" },
  ],
};

// =================== FB FLOOR 2 ===================
const fbFloor2: FloorPlan = {
  id: "fb-f2",
  title: "FISHERIES BLOCK — FLOOR 2",
  subtitle: "Innovation Center",
  code: "12",
  svgWidth: 580,
  svgHeight: 560,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 170, h: 88 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 192, y: 22, w: 78, h: 502 },
    { id: "stairs", label: "Staircase", type: "stairs", x: 20, y: 112, w: 170, h: 88 },
    { id: "innov-l", label: "INNOV.", type: "innov", x: 20, y: 202, w: 170, h: 322 },
    { id: "innov-r", label: "INNOVATION CENTER", sublabel: "(L-shaped)", type: "innov", x: 272, y: 112, w: 188, h: 412 },
    { id: "lift", label: "Lift", type: "lift", x: 462, y: 112, w: 90, h: 412 },
  ],
  labels: [
    { text: "▲ FRONT", x: 300, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 300, y: 546, color: "amber", anchor: "middle" },
  ],
};

// =================== BB FLOOR 3 ===================
const bbFloor3: FloorPlan = {
  id: "bb-f3",
  title: "B BLOCK — FLOOR 3",
  subtitle: "I Year Classes",
  code: "13",
  svgWidth: 520,
  svgHeight: 540,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 484 },
    { id: "stairs", label: "Staircase", type: "stairs", x: 20, y: 94, w: 180, h: 88 },
    { id: "b1", label: "B1 — I BCA DS-1", type: "class", x: 260, y: 94, w: 240, h: 88 },
    { id: "b6", label: "B6 — I BSc AI-2", type: "class", x: 20, y: 184, w: 180, h: 88 },
    { id: "b2", label: "B2 — I BSc CS-2", type: "class", x: 260, y: 184, w: 240, h: 88 },
    { id: "b5", label: "B5 — I BCA-1", type: "class", x: 20, y: 274, w: 180, h: 88 },
    { id: "b3", label: "B3 — I BCA DS-2", type: "class", x: 260, y: 274, w: 240, h: 88 },
    { id: "b4", label: "B4 — I BSc AI-1", type: "class", x: 20, y: 364, w: 180, h: 88 },
    { id: "lift", label: "Lift", type: "lift", x: 260, y: 364, w: 240, h: 44 },
    { id: "wc", label: "Washroom", type: "wc", x: 260, y: 410, w: 240, h: 42 },
  ],
  labels: [
    { text: "▲ FRONT", x: 260, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 260, y: 520, color: "amber", anchor: "middle" },
  ],
};

// =================== BB FLOOR 4 ===================
const bbFloor4: FloorPlan = {
  id: "bb-f4",
  title: "B BLOCK — FLOOR 4",
  subtitle: "I Year Classes",
  code: "14",
  svgWidth: 520,
  svgHeight: 540,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 484 },
    { id: "stairs", label: "Staircase", type: "stairs", x: 20, y: 94, w: 180, h: 88 },
    { id: "b7", label: "B7 — I BSc DS-1", type: "class", x: 260, y: 94, w: 240, h: 88 },
    { id: "b12", label: "B12 — I BSc CS-2", type: "class", x: 20, y: 184, w: 180, h: 88 },
    { id: "b8", label: "B8 — I BCA-2", type: "class", x: 260, y: 184, w: 240, h: 88 },
    { id: "b11", label: "B11 — I BBA-DM", type: "class", x: 20, y: 274, w: 180, h: 88 },
    { id: "b9", label: "B9 — I BBA-G", type: "class", x: 260, y: 274, w: 240, h: 88 },
    { id: "b10", label: "B10 — I BSc CS-1", type: "class", x: 20, y: 364, w: 180, h: 88 },
    { id: "lift", label: "Lift", type: "lift", x: 260, y: 364, w: 240, h: 44 },
    { id: "wc", label: "Washroom", type: "wc", x: 260, y: 410, w: 240, h: 42 },
  ],
  labels: [
    { text: "▲ FRONT", x: 260, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 260, y: 520, color: "amber", anchor: "middle" },
  ],
};

// =================== BB FLOOR 5 ===================
const bbFloor5: FloorPlan = {
  id: "bb-f5",
  title: "B BLOCK — FLOOR 5",
  subtitle: "I Year Classes · Empty Rooms",
  code: "15",
  svgWidth: 520,
  svgHeight: 540,
  rooms: [
    { id: "staff", label: "Staff Room", type: "staff", x: 20, y: 22, w: 180, h: 70 },
    { id: "corridor", label: "CORRIDOR", type: "corridor", x: 202, y: 22, w: 56, h: 484 },
    { id: "stairs", label: "Staircase", type: "stairs", x: 20, y: 94, w: 180, h: 88 },
    { id: "b13", label: "B13 — I BSc CS-3", type: "class", x: 260, y: 94, w: 240, h: 88 },
    { id: "b16", label: "B16 — Empty", type: "corridor", x: 20, y: 184, w: 180, h: 88 },
    { id: "b14", label: "B14 — I BSc MB", type: "class", x: 260, y: 184, w: 240, h: 88 },
    { id: "b17", label: "B17 — Empty", type: "corridor", x: 20, y: 274, w: 180, h: 88 },
    { id: "b15", label: "B15 — I BSc AI-3", type: "class", x: 260, y: 274, w: 240, h: 88 },
    { id: "b18", label: "B18 — Empty", type: "corridor", x: 20, y: 364, w: 180, h: 88 },
    { id: "lift", label: "Lift", type: "lift", x: 260, y: 364, w: 240, h: 44 },
    { id: "wc", label: "Washroom", type: "wc", x: 260, y: 410, w: 240, h: 42 },
  ],
  labels: [
    { text: "▲ FRONT", x: 260, y: 14, color: "green", anchor: "middle" },
    { text: "▼ BACK", x: 260, y: 520, color: "amber", anchor: "middle" },
  ],
};

// =================== SHEDS ===================
const sheds: FloorPlan = {
  id: "sheds",
  title: "CAMPUS SHEDS",
  subtitle: "Shed 3 · Shed 2 · Open Area · Shed 1 · Shed 4",
  code: "90",
  svgWidth: 800,
  svgHeight: 660,
  rooms: [
    // Shed 3
    { id: "seminar-hall", label: "Seminar Hall", sublabel: "3 rows", type: "hod", x: 20, y: 22, w: 140, h: 120 },
    { id: "r14", label: "R14", type: "class", x: 20, y: 144, w: 140, h: 68 },
    { id: "r15", label: "R15", type: "class", x: 20, y: 214, w: 140, h: 68 },
    { id: "r16", label: "R16", type: "class", x: 20, y: 284, w: 140, h: 68 },
    { id: "r17", label: "R17", type: "class", x: 20, y: 354, w: 140, h: 68 },
    { id: "r18", label: "R18", type: "class", x: 20, y: 424, w: 140, h: 68 },
    // Path
    { id: "path1", label: "path", type: "corridor", x: 162, y: 22, w: 26, h: 470 },
    // Shed 2
    { id: "r13", label: "R13", type: "class", x: 190, y: 22, w: 156, h: 68 },
    { id: "r12", label: "R12", type: "class", x: 190, y: 92, w: 156, h: 68 },
    { id: "r11", label: "R11", type: "class", x: 190, y: 162, w: 156, h: 68 },
    { id: "r10", label: "R10", type: "class", x: 190, y: 232, w: 156, h: 68 },
    { id: "r9", label: "R9", type: "class", x: 190, y: 302, w: 156, h: 68 },
    { id: "r8", label: "R8", type: "class", x: 190, y: 372, w: 156, h: 68 },
    { id: "r7", label: "R7", type: "class", x: 190, y: 442, w: 156, h: 50 },
    // Open area
    { id: "open-stage", label: "Open Stage", type: "open", x: 350, y: 22, w: 266, h: 120 },
    { id: "open-ground", label: "Open Ground", type: "open", x: 350, y: 144, w: 266, h: 160 },
    { id: "badminton", label: "Badminton Court", type: "court", x: 350, y: 306, w: 266, h: 186 },
    // Shed 1
    { id: "waiting", label: "Waiting Hall", type: "class", x: 622, y: 22, w: 156, h: 68 },
    { id: "r1", label: "R1", type: "class", x: 622, y: 92, w: 156, h: 68 },
    { id: "r2", label: "R2", type: "class", x: 622, y: 162, w: 156, h: 68 },
    { id: "r3", label: "R3", type: "class", x: 622, y: 232, w: 156, h: 68 },
    { id: "r4", label: "R4", type: "class", x: 622, y: 302, w: 156, h: 68 },
    { id: "r5", label: "R5", type: "class", x: 622, y: 372, w: 156, h: 68 },
    { id: "r6", label: "R6", type: "class", x: 622, y: 442, w: 156, h: 50 },
    // Shed 4
    { id: "shed4-wc", label: "WC", type: "wc", x: 20, y: 526, w: 130, h: 80 },
    { id: "shed4-store", label: "Store Room", type: "class", x: 152, y: 526, w: 150, h: 80 },
    { id: "shed4-dining", label: "Dining Hall", type: "canteen", x: 304, y: 526, w: 180, h: 80 },
    { id: "shed4-yoga", label: "Yoga & Sports", type: "open", x: 486, y: 526, w: 160, h: 80 },
    { id: "shed4-empty", label: "Empty Room", type: "corridor", x: 648, y: 526, w: 130, h: 80 },
  ],
  labels: [
    { text: "SHED 3", x: 90, y: 14, color: "amber", anchor: "middle" },
    { text: "SHED 2", x: 268, y: 14, color: "amber", anchor: "middle" },
    { text: "OPEN AREA", x: 462, y: 14, color: "amber", anchor: "middle" },
    { text: "SHED 1", x: 680, y: 14, color: "amber", anchor: "middle" },
    { text: "SHED 4 — HORIZONTAL", x: 440, y: 510, color: "amber", anchor: "middle" },
  ],
};

export const allFloorPlans: Record<string, FloorPlan> = {
  campus: campusOverview,
  "mb-gf": mbGroundFloor,
  "mb-f1": mbFloor1,
  "mb-f2": mbFloor2,
  "mb-f3": mbFloor3,
  "mb-f4": mbFloor4,
  "mb-f5": mbFloor5,
  "fb-gf": fbGroundFloor,
  "fb-f1": fbFloor1,
  "fb-f2": fbFloor2,
  "bb-f3": bbFloor3,
  "bb-f4": bbFloor4,
  "bb-f5": bbFloor5,
  sheds: sheds,
};

// Collect all searchable rooms
export function getAllRooms(): { room: Room; floorId: string; floorTitle: string }[] {
  const results: { room: Room; floorId: string; floorTitle: string }[] = [];
  for (const [floorId, plan] of Object.entries(allFloorPlans)) {
    for (const room of plan.rooms) {
      if (room.label && room.type !== "corridor") {
        results.push({ room, floorId, floorTitle: plan.title });
      }
    }
  }
  return results;
}
