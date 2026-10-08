import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { checkPersonAccess } from './AccessControlService.js';
import { publishAlert, publishDetection } from '../utils/events.js';

const uid = () => crypto.randomUUID();

/**
 * CCTVLocationService — CCTV is the location source (NO QR, NO checkpoints).
 * A camera's mapped location becomes the person's current location.
 */

async function findCamera(cameraId) {
  // Accept either the internal id or the human identifier (e.g. "CAM-04").
  const r = await query(
    'SELECT * FROM cameras WHERE id = $1 OR camera_identifier = $1 LIMIT 1',
    [cameraId]
  );
  return r.rows[0] ?? null;
}

/**
 * @param {object} e
 * @param {string} e.cameraId
 * @param {string} [e.personId]
 * @param {string} [e.visitorId]
 * @param {string} [e.timestamp]
 * @param {number} [e.confidence]
 * @param {'cctv'|'manual'} [e.detectionMethod]
 */
export async function processCCTVDetection({
  cameraId,
  personId = null,
  visitorId = null,
  timestamp = null,
  confidence = 0.95,
  detectionMethod = 'cctv',
}) {
  const camera = await findCamera(cameraId);
  if (!camera) {
    const err = new Error('Unknown camera');
    err.status = 404;
    throw err;
  }
  if (!camera.location_id) {
    const err = new Error('Camera is not mapped to a location');
    err.status = 422;
    throw err;
  }

  const loc = await query('SELECT * FROM locations WHERE id = $1', [camera.location_id]);
  const location = loc.rows[0] ?? null;

  // Resolve visitor identity for the response payload.
  let visitor = null;
  if (visitorId) {
    const v = await query('SELECT * FROM visitors WHERE id = $1 OR visitor_code = $1 LIMIT 1', [visitorId]);
    visitor = v.rows[0] ?? null;
    if (visitor) visitorId = visitor.id;
  }

  const access = await checkPersonAccess({ personId, visitorId, locationId: camera.location_id });
  // Column CHECK allows only 'authorized' | 'restricted'.
  const accessStatus = access.status === 'authorized' ? 'authorized' : 'restricted';

  const detectedAt = timestamp ? new Date(timestamp) : new Date();

  // 4. Record the location event.
  const eventId = uid();
  await query(
    `INSERT INTO visitor_location_events
       (id, person_id, visitor_id, camera_id, location_id, detection_method, detected_at, confidence, access_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [eventId, personId, visitorId, camera.id, camera.location_id, detectionMethod, detectedAt, confidence, accessStatus]
  );

  const subjectName = visitor?.full_name ?? personId ?? 'Unknown person';
  const detectionPayload = {
    eventId,
    personId,
    visitorId,
    visitorCode: visitor?.visitor_code ?? null,
    visitorName: subjectName,
    visitorType: visitor?.visitor_type ?? null,
    cameraId: camera.camera_identifier,
    cameraName: camera.camera_name,
    locationId: camera.location_id,
    currentLocation: location?.name ?? camera.camera_location ?? null,
    floorPlanId: location?.floor_plan_id ?? camera.floor_plan_id ?? null,
    roomId: location?.room_id ?? camera.room_id ?? null,
    status: accessStatus,
    access: access.access,
    accessStatus,
    color: access.color,
    confidence,
    detectedAt,
  };

  let alertCreated = false;
  let alert = null;

  // 7-9. Restricted access -> HIGH severity alert, pushed in realtime.
  if (access.access === 'restricted') {
    alert = await createSecurityAlert({
      personId,
      visitorId,
      locationId: camera.location_id,
      cameraId: camera.id,
      alertType: visitor ? 'restricted_access' : 'unknown_person',
      severity: 'high',
      message: `${subjectName} detected in a restricted area (${location?.name ?? camera.camera_location}) by ${camera.camera_identifier}. Unauthorized access detected.`,
      detectedAt,
    });
    alertCreated = true;
  }

  publishDetection(detectionPayload);

  return {
    ...detectionPayload,
    alertCreated,
    alert,
  };
}

/** Create + broadcast a security alert. */
export async function createSecurityAlert({
  personId = null,
  visitorId = null,
  locationId = null,
  cameraId = null,
  alertType = 'manual',
  severity = 'high',
  message = '',
  detectedAt = new Date(),
}) {
  const id = uid();
  const r = await query(
    `INSERT INTO security_alerts
       (id, person_id, visitor_id, location_id, camera_id, alert_type, severity, message, status, detected_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9)
     RETURNING *`,
    [id, personId, visitorId, locationId, cameraId, alertType, severity, message, detectedAt]
  );
  const alert = await hydrateAlert(r.rows[0]);
  publishAlert(alert);
  return alert;
}

/** Attach visitor/location/camera display names to an alert row. */
export async function hydrateAlert(alert) {
  if (!alert) return alert;
  const [v, l, c] = await Promise.all([
    alert.visitor_id ? query('SELECT full_name, visitor_code, visitor_type FROM visitors WHERE id=$1', [alert.visitor_id]) : null,
    alert.location_id ? query('SELECT name, floor_plan_id, room_id FROM locations WHERE id=$1', [alert.location_id]) : null,
    alert.camera_id ? query('SELECT camera_identifier, camera_name FROM cameras WHERE id=$1', [alert.camera_id]) : null,
  ]);
  return {
    ...alert,
    visitor_name: v?.rows[0]?.full_name ?? null,
    visitor_code: v?.rows[0]?.visitor_code ?? null,
    visitor_type: v?.rows[0]?.visitor_type ?? null,
    location_name: l?.rows[0]?.name ?? null,
    floor_plan_id: l?.rows[0]?.floor_plan_id ?? null,
    room_id: l?.rows[0]?.room_id ?? null,
    camera_identifier: c?.rows[0]?.camera_identifier ?? null,
    camera_name: c?.rows[0]?.camera_name ?? null,
  };
}

export const CCTVLocationService = { processCCTVDetection, createSecurityAlert, hydrateAlert };
export default CCTVLocationService;
