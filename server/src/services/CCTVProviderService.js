import { query } from '../config/db.js';
import { bus, EVENTS } from '../utils/events.js';

/**
 * CCTVProviderService — clean abstraction over the camera source.
 *
 * The prototype uses a SIMULATED provider. The same interface is designed so a
 * future, institution-authorized integration (ONVIF, NVR/DVR/VMS APIs, vendor
 * SDKs) can be dropped in without changing callers.
 *
 * SECURITY: no camera credentials, private IPs, or API keys are hardcoded or
 * stored. Real stream URLs would come from environment/secret storage and be
 * provided only by the college IT/security team at deployment time.
 */

export async function getCameras() {
  const r = await query(
    `SELECT c.*, l.name AS location_name, l.floor_plan_id AS loc_floor_plan_id, l.room_id AS loc_room_id
     FROM cameras c LEFT JOIN locations l ON l.id = c.location_id
     WHERE c.is_active = TRUE
     ORDER BY c.camera_identifier`
  );
  return r.rows;
}

export async function getCameraStatus(cameraId) {
  const r = await query(
    'SELECT id, camera_identifier, status, integration_type FROM cameras WHERE id=$1 OR camera_identifier=$1 LIMIT 1',
    [cameraId]
  );
  const cam = r.rows[0];
  if (!cam) return null;
  // Simulated provider always reports the stored status.
  return { cameraId: cam.camera_identifier, status: cam.status, integrationType: cam.integration_type, live: cam.status === 'online' };
}

/**
 * Return a stream descriptor. For the simulated provider this is a placeholder
 * — NEVER a real stream URL. A real provider would return an authorized,
 * short-lived token/URL sourced from secure configuration.
 */
export async function getCameraStream(cameraId) {
  const r = await query('SELECT * FROM cameras WHERE id=$1 OR camera_identifier=$1 LIMIT 1', [cameraId]);
  const cam = r.rows[0];
  if (!cam) return null;
  if (cam.integration_type === 'simulated') {
    return { cameraId: cam.camera_identifier, type: 'simulated', placeholder: true, streamUrl: null };
  }
  // Future: resolve a real, authorized stream here (ONVIF/VMS/vendor SDK).
  return { cameraId: cam.camera_identifier, type: cam.integration_type, placeholder: true, streamUrl: null };
}

/**
 * Subscribe to detection events. The simulated provider surfaces events that
 * were produced via the detection API; a real provider would push analytics
 * events from the video pipeline into the same channel.
 */
export function subscribeToDetections(handler) {
  bus.on(EVENTS.DETECTION, handler);
  return () => bus.off(EVENTS.DETECTION, handler);
}

export const CCTVProviderService = { getCameras, getCameraStatus, getCameraStream, subscribeToDetections };
export default CCTVProviderService;
