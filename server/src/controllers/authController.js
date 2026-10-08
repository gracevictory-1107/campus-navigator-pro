import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/db.js';
import { uid } from '../utils/ids.js';
import { validate } from '../utils/validate.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { signToken } from '../middleware/auth.js';

// Public sign-up may only create unprivileged accounts. staff/management/security/admin
// are granted by an authenticated admin through PUT /users/:id.
const SELF_SERVICE_ROLES = ['student', 'faculty'];

const registerSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(6).max(100),
  role: z.enum(SELF_SERVICE_ROLES).default('student'),
  college_id: z.string().max(40).optional().nullable(),
  department: z.string().max(80).optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

export const register = asyncHandler(async (req, res) => {
  const data = validate(registerSchema, req.body);
  const existing = await query('SELECT id FROM users WHERE email=$1', [data.email.toLowerCase()]);
  if (existing.rowCount > 0) throw new ApiError(409, 'Email already registered');

  const id = uid();
  const hash = bcrypt.hashSync(data.password, 10);
  const r = await query(
    `INSERT INTO users (id, full_name, email, phone, password_hash, role, college_id, department, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING *`,
    [id, data.full_name, data.email.toLowerCase(), data.phone ?? null, hash, data.role, data.college_id ?? null, data.department ?? null]
  );
  const user = publicUser(r.rows[0]);
  res.status(201).json({ user, token: signToken(r.rows[0]) });
});

export const login = asyncHandler(async (req, res) => {
  const data = validate(loginSchema, req.body);
  const r = await query('SELECT * FROM users WHERE email=$1 LIMIT 1', [data.email.toLowerCase()]);
  const user = r.rows[0];
  if (!user || !bcrypt.compareSync(data.password, user.password_hash)) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.is_active) throw new ApiError(403, 'Account is deactivated');
  res.json({ user: publicUser(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM users WHERE id=$1 LIMIT 1', [req.user.sub]);
  if (r.rowCount === 0) throw new ApiError(404, 'User not found');
  res.json({ user: publicUser(r.rows[0]) });
});
