

# Layout Updates for 3 Floors

## 1. Main Building Floor 5 — Room Changes

**Current state:**
- R32 is a large room (h: 184) spanning from y:22 to y:206 on the right side
- R38 is below it (y:208, h:70)

**Changes:**
- Rename R38 to R33 (label: "R33 — II BBA-G")
- Combine R32 and R33 (old R38) area into one tall zone, then split it into two equal halves vertically
- Top half: R32 — II BSc CS-3 (A + B sections)
- Bottom half: R33 — II BBA-G

This means both rooms get equal height of ~128px each (total area from y:22 to y:278).

---

## 2. Main Building Ground Floor — Admin Area Rework

**New spatial logic based on your description:**
- Cash Counter starts at the right edge, aligned with the top row
- VP Cabin starts exactly parallel (same x) to Cash Counter start, positioned below the top row, with some gap before Help Desk
- Help Desk is opposite to VP Cabin, at the far right edge of the wall, with space between VP and Help Desk
- Administrative Desk spans from the Cash Counter start wall to the Main Entrance end wall (top row, right side)
- Office Desk spans below VP Cabin and Help Desk, from Cash Counter start wall to Main Entrance end wall

Adjusted room coordinates to reflect this spatial arrangement with proper gaps and alignment.

---

## 3. Fisheries Block Floor 1 — Height Alignment

**Current state:** Rooms have inconsistent heights. Room 6 is very tall (h:172), washrooms are also tall.

**New alignment rules:**
- Room 6 height = Room 5 height (same h)
- Washrooms height matches and aligns parallel to Room 6
- Lift ends parallel with Room 6
- Room 5 aligns parallel to Room 3 (same row)
- Room 4 aligns parallel to Room 2 (same row)
- Stairs aligns parallel to Room 1 (same row)

This restructures the right and left columns into properly aligned rows.

---

## Technical Details

All changes are in `src/data/floorPlans.ts`:

**MB Floor 5 (lines 282-309):** Update R32 to h:128, rename R38 to R33 with label "R33 -- II BBA-G" and adjust y/h to split the combined area equally.

**MB Ground Floor (lines 114-158):** Reposition VP Cabin, Help Desk, Administrative Desk, Cash Counter, and Office Desk with correct spatial relationships and gaps.

**FB Floor 1 (lines 344-368):** Recalculate all room y-positions and heights so left-column rooms (Staff, Stairs, Room 4, Room 5, Room 6, Ladies WC) align horizontally with right-column rooms (Room 1, Room 2, Room 3, Lift, Washrooms) in parallel rows with consistent heights.

