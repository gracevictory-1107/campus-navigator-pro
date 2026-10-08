import { z } from 'zod';
import { query } from '../config/db.js';
import { uid, generateVisitorCode } from '../utils/ids.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const VISITOR_TYPES = ['parent', 'visitor', 'recruiter'];

const createSchema = z.object({
  full_name: z.string().min(2).max(120),
  mobile_number: z.string().max(20).optional().nullable(),
  visitor_type: z.enum(VISITOR_TYPES),
  visiting_student_id: z.string().max(40).optional().nullable(),
  purpose: z.string().max(200).optional().nullable(),
  authorized_location_id: z.string().optional().nullable(),
  expected_exit_time: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(['active', 'exited', 'blocked']).optional(),
});

async function uniqueVisitorCode() {
  for (let i = 0; i < 8; i++) {
    const code = generateVisitorCode();
    const exists = await query('SELECT id FROM visitors WHERE visitor_code=$1', [code]);
    if (exists.rowCount === 0) return code;
  }
  throw new ApiError(500, 'Could not generate a unique visitor code');
}

async function loadVisitor(id) {
  const r = await query(
    `SELECT v.*, l.name AS authorized_location_name, u.full_name AS created_by_name
     FROM visitors v
     LEFT JOIN locations l ON l.id = v.authorized_location_id
     LEFT JOIN users u ON u.id = v.created_by
     WHERE v.id = $1 OR v.visitor_code = $1
     LIMIT 1`,
    [id]
  );
  return r.rows[0] ?? null;
}

export const listVisitors = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const r = status
    ? await query(
        `SELECT v.*, l.name AS authorized_location_name FROM visitors v
         LEFT JOIN locations l ON l.id=v.authorized_location_id
         WHERE v.status=$1 ORDER BY v.created_at DESC`, [status])
    : await query(
        `SELECT v.*, l.name AS authorized_location_name FROM visitors v
         LEFT JOIN locations l ON l.id=v.authorized_location_id
         ORDER BY v.created_at DESC`);
  res.json({ visitors: r.rows });
});

export const getVisitor = asyncHandler(async (req, res) => {
  const v = await loadVisitor(req.params.id);
  if (!v) throw new ApiError(404, 'Visitor not found');
  // Include the latest known location + any face profile reference.
  const [ev, fp] = await Promise.all([
    query(
      `SELECT e.*, l.name AS location_name, c.camera_identifier
       FROM visitor_location_events e
       LEFT JOIN locations l ON l.id=e.location_id
       LEFT JOIN cameras c ON c.id=e.camera_id
       WHERE e.visitor_id=$1 ORDER BY e.detected_at DESC LIMIT 1`, [v.id]),
    query('SELECT provider, external_face_reference, verification_status FROM face_profiles WHERE visitor_id=$1 ORDER BY created_at DESC LIMIT 1', [v.id]),
  ]);
  res.json({ visitor: v, lastEvent: ev.rows[0] ?? null, faceProfile: fp.rows[0] ?? null });
});

export const createVisitor = asyncHandler(async (req, res) => {
  const data = validate(createSchema, req.body);
  if (data.authorized_location_id) {
    const loc = await query('SELECT id FROM locations WHERE id=$1', [data.authorized_location_id]);
    if (loc.rowCount === 0) throw new ApiError(400, 'Unknown authorized_location_id');
  }
  const id = uid();
  const code = await uniqueVisitorCode();
  await query(
    `INSERT INTO visitors
       (id, visitor_code, full_name, mobile_number, visitor_type, visiting_student_id, purpose,
        authorized_location_id, entry_time, expected_exit_time, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), $9, 'active', $10)`,
    [id, code, data.full_name, data.mobile_number ?? null, data.visitor_type,
     data.visiting_student_id ?? null, data.purpose ?? null, data.authorized_location_id ?? null,
     data.expected_exit_time ? new Date(data.expected_exit_time) : null, req.user.sub]
  );
  const v = await loadVisitor(id);
  res.status(201).json({ visitor: v });
});

export const updateVisitor = asyncHandler(async (req, res) => {
  const existing = await loadVisitor(req.params.id);
  if (!existing) throw new ApiError(404, 'Visitor not found');
  const data = validate(updateSchema, req.body);

  const fields = [];
  const params = [];
  let i = 1;
  const map = {
    full_name: 'full_name', mobile_number: 'mobile_number', visitor_type: 'visitor_type',
    visiting_student_id: 'visiting_student_id', purpose: 'purpose',
    authorized_location_id: 'authorized_location_id', status: 'status',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) { fields.push(`${col}=$${i++}`); params.push(data[key]); }
  }
  if (data.expected_exit_time !== undefined) { fields.push(`expected_exit_time=$${i++}`); params.push(data.expected_exit_time ? new Date(data.expected_exit_time) : null); }
  if (fields.length === 0) return res.json({ visitor: existing });

  fields.push(`updated_at=now()`);
  params.push(existing.id);
  await query(`UPDATE visitors SET ${fields.join(', ')} WHERE id=$${i}`, params);
  res.json({ visitor: await loadVisitor(existing.id) });
});

export const checkIn = asyncHandler(async (req, res) => {
  const v = await loadVisitor(req.params.id);
  if (!v) throw new ApiError(404, 'Visitor not found');
  await query(`UPDATE visitors SET status='active', entry_time=now(), exit_time=NULL, updated_at=now() WHERE id=$1`, [v.id]);
  res.json({ visitor: await loadVisitor(v.id) });
});

export const checkOut = asyncHandler(async (req, res) => {
  const v = await loadVisitor(req.params.id);
  if (!v) throw new ApiError(404, 'Visitor not found');
  await query(`UPDATE visitors SET status='exited', exit_time=now(), updated_at=now() WHERE id=$1`, [v.id]);
  res.json({ visitor: await loadVisitor(v.id) });
});
