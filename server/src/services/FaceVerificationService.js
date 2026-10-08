import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { getFaceVerificationProvider } from './FaceVerificationProvider.js';

const uid = () => crypto.randomUUID();
const DEFAULT_PROVIDER = process.env.FACE_PROVIDER || 'simulated';

export async function enrollPerson({ visitorId = null, personId = null, provider = DEFAULT_PROVIDER }) {
  if (!visitorId && !personId) {
    const error = new Error('visitorId or personId is required');
    error.status = 400;
    throw error;
  }

  const existing = visitorId
    ? await query('SELECT * FROM face_profiles WHERE visitor_id=$1 ORDER BY created_at DESC LIMIT 1', [visitorId])
    : await query('SELECT * FROM face_profiles WHERE person_id=$1 ORDER BY created_at DESC LIMIT 1', [personId]);
  if (existing.rows[0]) {
    return {
      enrolled: false,
      profile: existing.rows[0],
      verified: existing.rows[0].verification_status === 'verified',
      personId: existing.rows[0].person_id,
    };
  }

  const adapter = getFaceVerificationProvider(provider);
  const enrollment = await adapter.enroll({ visitorId, personId });
  const id = uid();
  const r = await query(
    `INSERT INTO face_profiles
       (id, person_id, visitor_id, provider, external_face_reference, verification_status, enrolled_at)
     VALUES ($1,$2,$3,$4,$5,'verified', now())
     RETURNING *`,
    [id, personId ?? visitorId, visitorId, adapter.name, enrollment.externalFaceReference]
  );
  return { enrolled: true, profile: r.rows[0], verified: enrollment.verified, personId: personId ?? visitorId };
}

export async function verifyPerson({ visitorId = null, personId = null, externalFaceReference = null, provider = DEFAULT_PROVIDER }) {
  let profile = null;

  if (externalFaceReference) {
    const r = await query(
      'SELECT * FROM face_profiles WHERE external_face_reference = $1 LIMIT 1',
      [externalFaceReference]
    );
    profile = r.rows[0] ?? null;
  } else if (visitorId) {
    const r = await query(
      'SELECT * FROM face_profiles WHERE visitor_id = $1 ORDER BY created_at DESC LIMIT 1',
      [visitorId]
    );
    profile = r.rows[0] ?? null;
  } else if (personId) {
    const r = await query(
      'SELECT * FROM face_profiles WHERE person_id = $1 ORDER BY created_at DESC LIMIT 1',
      [personId]
    );
    profile = r.rows[0] ?? null;
  }

  const adapter = getFaceVerificationProvider(provider);
  const verification = await adapter.verify({ profile });
  if (!verification.verified || !profile) {
    return { verified: false, personId: null, reason: 'no_matching_profile', provider: adapter.name, simulated: true };
  }

  await query(
    `UPDATE face_profiles SET verification_status='verified', last_verified_at=now(), updated_at=now() WHERE id=$1`,
    [profile.id]
  );

  let visitor = null;
  if (profile.visitor_id) {
    const v = await query(
      `SELECT v.*, l.name AS authorized_location_name
       FROM visitors v LEFT JOIN locations l ON l.id=v.authorized_location_id
       WHERE v.id=$1`,
      [profile.visitor_id]
    );
    visitor = v.rows[0] ?? null;
  }

  return {
    verified: true,
    personId: profile.person_id,
    visitorId: profile.visitor_id ?? null,
    visitor,
    externalFaceReference: verification.externalFaceReference,
    provider: adapter.name,
    simulated: true,
  };
}

export const FaceVerificationService = { enrollPerson, verifyPerson };
export default FaceVerificationService;
