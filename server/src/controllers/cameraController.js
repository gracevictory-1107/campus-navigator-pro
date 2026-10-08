import { z } from 'zod';
import { query } from '../config/db.js';
import { uid } from '../utils/ids.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { getCameras, getCameraStatus, getCameraStream } from '../services/CCTVProviderService.js';

const STATUSES = ['online', 'offline', 'maintenance'];
const INTEGRATIONS = ['simulated', 'onvif', 'api', 'sdk', 'rtsp', 'vms'];

const cameraSchema = z.object({
  camera_name: z.string().min(1).max(120),
  camera_location: z.string().max(120).optional().nullable(),
  location_id: z.string().optional().nullable(),
  status: z.enum(STATUSES).default('online'),
  provider: z.string().max(80).optional().nullable(),
  integration_type: z.enum(INTEGRATIONS).default('simulated'),
  stream_url: z.string().url().optional().nullable(),
  camera_identifier: z.string().min(1).max(40),
  floor_plan_id: z.string().max(40).optional().nullable(),
  room_id: z.string().max(60).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const listCameras = asyncHandler(async (_req, res) => {
  res.json({ cameras: await getCameras() });
});

export const createCamera = asyncHandler(async (req, res) => {
  const data = validate(cameraSchema, req.body);
  const dup = await query('SELECT id FROM cameras WHERE camera_identifier=$1', [data.camera_identifier]);
  if (dup.rowCount > 0) throw new ApiError(409, 'camera_identifier already exists');
  const id = uid();
  const r = await query(
    `INSERT INTO cameras
       (id, camera_name, camera_location, location_id, status, provider, integration_type, stream_url, camera_identifier, floor_plan_id, room_id, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [id, data.camera_name, data.camera_location ?? null, data.location_id ?? null, data.status,
     data.provider ?? null, data.integration_type, data.stream_url ?? null, data.camera_identifier,
     data.floor_plan_id ?? null, data.room_id ?? null, data.is_active ?? true]
  );
  res.status(201).json({ camera: r.rows[0] });
});

export const updateCamera = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM cameras WHERE id=$1', [req.params.id]);
  if (existing.rowCount === 0) throw new ApiError(404, 'Camera not found');
  const data = validate(cameraSchema.partial(), req.body);
  const cols = ['camera_name', 'camera_location', 'location_id', 'status', 'provider', 'integration_type', 'stream_url', 'camera_identifier', 'floor_plan_id', 'room_id', 'is_active'];
  const fields = [];
  const params = [];
  let i = 1;
  for (const col of cols) {
    if (data[col] !== undefined) { fields.push(`${col}=$${i++}`); params.push(data[col]); }
  }
  if (fields.length === 0) return res.json({ camera: existing.rows[0] });
  fields.push('updated_at=now()');
  params.push(req.params.id);
  const r = await query(`UPDATE cameras SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, params);
  res.json({ camera: r.rows[0] });
});

export const deleteCamera = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM cameras WHERE id=$1 RETURNING id', [req.params.id]);
  if (r.rowCount === 0) throw new ApiError(404, 'Camera not found');
  res.json({ deleted: true, id: req.params.id });
});

export const cameraStatus = asyncHandler(async (req, res) => {
  const status = await getCameraStatus(req.params.id);
  if (!status) throw new ApiError(404, 'Camera not found');
  res.json(status);
});

export const cameraStream = asyncHandler(async (req, res) => {
  const stream = await getCameraStream(req.params.id);
  if (!stream) throw new ApiError(404, 'Camera not found');
  res.json(stream);
});
