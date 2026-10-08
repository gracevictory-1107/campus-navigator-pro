import { z } from 'zod';
import { query } from '../config/db.js';
import { uid } from '../utils/ids.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const ACCESS_TYPES = ['public', 'authorized', 'restricted'];

const locationSchema = z.object({
  name: z.string().min(1).max(120),
  building: z.string().max(80).optional().nullable(),
  floor: z.string().max(40).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  access_type: z.enum(ACCESS_TYPES).default('public'),
  floor_plan_id: z.string().max(40).optional().nullable(),
  room_id: z.string().max(60).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const listLocations = asyncHandler(async (_req, res) => {
  const r = await query('SELECT * FROM locations ORDER BY building NULLS FIRST, name');
  res.json({ locations: r.rows });
});

export const createLocation = asyncHandler(async (req, res) => {
  const data = validate(locationSchema, req.body);
  const id = uid();
  const r = await query(
    `INSERT INTO locations (id, name, building, floor, description, access_type, floor_plan_id, room_id, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, data.name, data.building ?? null, data.floor ?? null, data.description ?? null,
     data.access_type, data.floor_plan_id ?? null, data.room_id ?? null, data.is_active ?? true]
  );
  res.status(201).json({ location: r.rows[0] });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM locations WHERE id=$1', [req.params.id]);
  if (existing.rowCount === 0) throw new ApiError(404, 'Location not found');
  const data = validate(locationSchema.partial(), req.body);

  const fields = [];
  const params = [];
  let i = 1;
  for (const col of ['name', 'building', 'floor', 'description', 'access_type', 'floor_plan_id', 'room_id', 'is_active']) {
    if (data[col] !== undefined) { fields.push(`${col}=$${i++}`); params.push(data[col]); }
  }
  if (fields.length === 0) return res.json({ location: existing.rows[0] });
  fields.push('updated_at=now()');
  params.push(req.params.id);
  const r = await query(`UPDATE locations SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, params);
  res.json({ location: r.rows[0] });
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const existing = await query('SELECT id FROM locations WHERE id=$1', [req.params.id]);
  if (existing.rowCount === 0) throw new ApiError(404, 'Location not found');
  try {
    await query('DELETE FROM locations WHERE id=$1', [req.params.id]);
  } catch (err) {
    if (err && /foreign key|constraint/i.test(err.message)) {
      throw new ApiError(409, 'Location is referenced by visitors, cameras, or rules and cannot be deleted.');
    }
    throw err;
  }
  res.status(204).end();
});
