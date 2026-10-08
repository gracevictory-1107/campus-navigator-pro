import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail closed: never run with an empty/default secret in production.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[auth] JWT_SECRET not set - using an insecure dev fallback. Set JWT_SECRET in .env');
}

export const SECRET = JWT_SECRET || 'dev-insecure-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, full_name: user.full_name },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

/** Require a valid Bearer token. Populates req.user. */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/** Require one of the given roles. Must run after authenticate. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}

// Role groups used across routes.
export const SECURITY_ROLES = ['security', 'admin'];
export const STAFF_ROLES = ['faculty', 'staff', 'management', 'security', 'admin'];
