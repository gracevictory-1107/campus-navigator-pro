import { query } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { hydrateAlert } from '../services/CCTVLocationService.js';
import { publishAlert } from '../utils/events.js';

export const listAlerts = asyncHandler(async (req, res) => {
  const { status, severity } = req.query;
  const clauses = [];
  const params = [];
  let i = 1;
  if (status) { clauses.push(`a.status=$${i++}`); params.push(status); }
  if (severity) { clauses.push(`a.severity=$${i++}`); params.push(severity); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(
    `SELECT a.*, v.full_name AS visitor_name, v.visitor_code, v.visitor_type,
            l.name AS location_name, l.floor_plan_id, l.room_id,
            c.camera_identifier, c.camera_name
     FROM security_alerts a
     LEFT JOIN visitors v ON v.id=a.visitor_id
     LEFT JOIN locations l ON l.id=a.location_id
     LEFT JOIN cameras c ON c.id=a.camera_id
     ${where}
     ORDER BY a.detected_at DESC`, params);
  res.json({ alerts: r.rows });
});

export const getAlert = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM security_alerts WHERE id=$1', [req.params.id]);
  if (r.rowCount === 0) throw new ApiError(404, 'Alert not found');
  res.json({ alert: await hydrateAlert(r.rows[0]) });
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const r = await query(
    `UPDATE security_alerts SET status='acknowledged', acknowledged_by=$1, acknowledged_at=now()
     WHERE id=$2 AND status='active' RETURNING *`,
    [req.user.sub, req.params.id]
  );
  if (r.rowCount === 0) {
    const exists = await query('SELECT id FROM security_alerts WHERE id=$1', [req.params.id]);
    if (exists.rowCount === 0) throw new ApiError(404, 'Alert not found');
    throw new ApiError(409, 'Alert is not active');
  }
  const alert = await hydrateAlert(r.rows[0]);
  publishAlert(alert);
  res.json({ alert });
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const r = await query(
    `UPDATE security_alerts SET status='resolved', resolved_by=$1, resolved_at=now()
     WHERE id=$2 AND status <> 'resolved' RETURNING *`,
    [req.user.sub, req.params.id]
  );
  if (r.rowCount === 0) {
    const exists = await query('SELECT id FROM security_alerts WHERE id=$1', [req.params.id]);
    if (exists.rowCount === 0) throw new ApiError(404, 'Alert not found');
    throw new ApiError(409, 'Alert already resolved');
  }
  const alert = await hydrateAlert(r.rows[0]);
  publishAlert(alert);
  res.json({ alert });
});
