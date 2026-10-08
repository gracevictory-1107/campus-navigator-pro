import { z } from 'zod';
import { query } from '../config/db.js';
import { uid } from '../utils/ids.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const SUBJECT_TYPES = ['user', 'visitor'];
const SUBJECT_ROLES = ['student', 'faculty', 'staff', 'management', 'security', 'admin', 'parent', 'visitor', 'recruiter'];
const ACCESS_STATUS = ['allowed', 'restricted'];

const ruleSchema = z.object({
  location_id: z.string().min(1),
  subject_type: z.enum(SUBJECT_TYPES),
  subject_role: z.enum(SUBJECT_ROLES),
  access_status: z.enum(ACCESS_STATUS),
});

export const listRules = asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT a.*, l.name AS location_name FROM access_rules a
     LEFT JOIN locations l ON l.id=a.location_id
     ORDER BY l.name, a.subject_role`
  );
  res.json({ accessRules: r.rows });
});

export const createRule = asyncHandler(async (req, res) => {
  const data = validate(ruleSchema, req.body);
  const loc = await query('SELECT id FROM locations WHERE id=$1', [data.location_id]);
  if (loc.rowCount === 0) throw new ApiError(400, 'Unknown location_id');
  const id = uid();
  const r = await query(
    `INSERT INTO access_rules (id, location_id, subject_type, subject_role, access_status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, data.location_id, data.subject_type, data.subject_role, data.access_status]
  );
  res.status(201).json({ accessRule: r.rows[0] });
});

export const updateRule = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM access_rules WHERE id=$1', [req.params.id]);
  if (existing.rowCount === 0) throw new ApiError(404, 'Access rule not found');
  const data = validate(ruleSchema.partial(), req.body);
  const fields = [];
  const params = [];
  let i = 1;
  for (const col of ['location_id', 'subject_type', 'subject_role', 'access_status']) {
    if (data[col] !== undefined) { fields.push(`${col}=$${i++}`); params.push(data[col]); }
  }
  if (fields.length === 0) return res.json({ accessRule: existing.rows[0] });
  params.push(req.params.id);
  const r = await query(`UPDATE access_rules SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, params);
  res.json({ accessRule: r.rows[0] });
});

export const deleteRule = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM access_rules WHERE id=$1 RETURNING id', [req.params.id]);
  if (r.rowCount === 0) throw new ApiError(404, 'Access rule not found');
  res.json({ deleted: true, id: req.params.id });
});
