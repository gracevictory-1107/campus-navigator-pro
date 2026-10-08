import { ApiError } from './errors.js';

/**
 * Validate `source` (req.body / req.query / req.params) against a zod schema.
 * Throws a 400 ApiError with field details on failure.
 */
export function validate(schema, source) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw new ApiError(400, 'Validation failed', details);
  }
  return result.data;
}
