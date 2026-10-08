import { query } from '../config/db.js';

/**
 * AccessControlService — the authoritative access decision. Runs on the
 * BACKEND only; the frontend must never be trusted to authorize.
 */

const PRIVILEGED_USER_ROLES = ['security', 'admin'];
const STAFF_USER_ROLES = ['faculty', 'staff', 'management', 'security', 'admin'];

function allowed(reason) {
  return { access: 'allowed', status: 'authorized', color: 'green', reason };
}
function restricted(reason) {
  return { access: 'restricted', status: 'unauthorized', color: 'red', reason };
}

/**
 * Determine whether a person may be present at a location.
 * @param {object} p
 * @param {string} [p.personId]  - a users.id (permanent campus identity)
 * @param {string} [p.visitorId] - a visitors.id (temporary identity)
 * @param {string} p.locationId
 */
export async function checkPersonAccess({ personId, visitorId, locationId }) {
  const loc = await query('SELECT * FROM locations WHERE id = $1', [locationId]);
  if (loc.rowCount === 0) return restricted('unknown_location');
  const location = loc.rows[0];

  let subjectType = null;
  let subjectRole = null;
  let visitor = null;
  let user = null;

  if (visitorId) {
    const v = await query('SELECT * FROM visitors WHERE id = $1', [visitorId]);
    if (v.rowCount === 0) return restricted('unknown_visitor');
    visitor = v.rows[0];
    subjectType = 'visitor';
    subjectRole = visitor.visitor_type;
    if (visitor.status === 'blocked') return restricted('visitor_blocked');
  } else if (personId) {
    const u = await query('SELECT * FROM users WHERE id = $1', [personId]);
    if (u.rowCount === 0) return restricted('unknown_person');
    user = u.rows[0];
    subjectType = 'user';
    subjectRole = user.role;
  } else {
    return restricted('no_subject');
  }

  // 1. Explicit access rule wins.
  const rule = await query(
    `SELECT access_status FROM access_rules
     WHERE location_id = $1 AND subject_type = $2 AND subject_role = $3
     LIMIT 1`,
    [locationId, subjectType, subjectRole]
  );
  if (rule.rowCount > 0) {
    return rule.rows[0].access_status === 'allowed'
      ? allowed('access_rule_allowed')
      : restricted('access_rule_restricted');
  }

  // 2. Fallback to the location's default access_type.
  switch (location.access_type) {
    case 'public':
      return allowed('public_location');
    case 'authorized':
      if (visitor) {
        return visitor.authorized_location_id === locationId
          ? allowed('visitor_authorized_destination')
          : restricted('not_authorized_destination');
      }
      return STAFF_USER_ROLES.includes(subjectRole)
        ? allowed('staff_authorized')
        : restricted('not_authorized');
    case 'restricted':
      if (user && PRIVILEGED_USER_ROLES.includes(user.role)) return allowed('privileged_role');
      return restricted('restricted_location');
    default:
      return restricted('unknown_access_type');
  }
}

export const AccessControlService = { checkPersonAccess };
export default AccessControlService;
