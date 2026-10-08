import { query } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

export const listEvents = asyncHandler(async (req, res) => {
  const r = await query(
    `SELECT e.*, v.full_name AS visitor_name, v.visitor_code, v.visitor_type,
            l.name AS location_name, l.floor_plan_id, l.room_id,
            c.camera_identifier, c.camera_name
     FROM visitor_location_events e
     LEFT JOIN visitors v ON v.id=e.visitor_id
     LEFT JOIN locations l ON l.id=e.location_id
     LEFT JOIN cameras c ON c.id=e.camera_id
     ORDER BY e.detected_at DESC
     LIMIT 200`);
  res.json({ events: r.rows });
});

export const eventsByPerson = asyncHandler(async (req, res) => {
  const personId = req.params.personId;
  const r = await query(
    `SELECT e.*, l.name AS location_name, l.floor_plan_id, l.room_id, c.camera_identifier
     FROM visitor_location_events e
     LEFT JOIN locations l ON l.id=e.location_id
     LEFT JOIN cameras c ON c.id=e.camera_id
     WHERE e.person_id=$1 OR e.visitor_id=$1
     ORDER BY e.detected_at DESC
     LIMIT 200`, [personId]);
  if (r.rowCount === 0) {
    // Distinguish "no events" from "unknown person".
    const v = await query('SELECT id FROM visitors WHERE id=$1 OR visitor_code=$1 LIMIT 1', [personId]);
    const u = await query('SELECT id FROM users WHERE id=$1 LIMIT 1', [personId]);
    if (v.rowCount === 0 && u.rowCount === 0) throw new ApiError(404, 'Person not found');
  }
  res.json({ personId, events: r.rows });
});
