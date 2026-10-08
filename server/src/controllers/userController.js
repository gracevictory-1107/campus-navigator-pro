import { z } from 'zod';
import { query } from '../config/db.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const ROLES = ['student', 'faculty', 'staff', 'management', 'security', 'admin'];

function publicUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    college_id: u.college_id,
    department: u.department,
    is_active: u.is_active,
  };
}

export const listUsers = asyncHandler(async (_req, res) => {
  const r = await query('SELECT * FROM users ORDER BY role, full_name');
  res.json({ users: r.rows.map(publicUser) });
});

const roleSchema = z.object({
  role: z.enum(ROLES),
  is_active: z.boolean().optional(),
});

export const updateUser = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (existing.rowCount === 0) throw new ApiError(404, 'User not found');
  const data = validate(roleSchema, req.body);

  const r = await query(
    `UPDATE users
        SET role=$2,
            is_active=COALESCE($3, is_active),
            updated_at=now()
      WHERE id=$1
      RETURNING *`,
    [req.params.id, data.role, data.is_active ?? null]
  );
  res.json({ user: publicUser(r.rows[0]) });
});
