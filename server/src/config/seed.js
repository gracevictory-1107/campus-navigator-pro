import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const uid = () => crypto.randomUUID();

// Demo locations mapped onto the EXISTING frontend floor-plan rooms so that
// detection markers render on the real campus maps (floor_plan_id + room_id).
const LOCATIONS = [
  { id: 'loc-reception',  name: 'Main Reception',  building: 'Main Building', floor: 'Ground Floor', access_type: 'public',     floor_plan_id: 'mb-gf', room_id: 'help-desk',    description: 'Front desk / visitor reception' },
  { id: 'loc-meeting',    name: 'Meeting Room',    building: 'Main Building', floor: 'Ground Floor', access_type: 'authorized', floor_plan_id: 'mb-gf', room_id: 'board-room',   description: 'Board / meeting room' },
  { id: 'loc-cse-lab',    name: 'CSE Laboratory',  building: 'Main Building', floor: 'First Floor',  access_type: 'restricted', floor_plan_id: 'mb-f1', room_id: 'comp1',        description: 'Computer Science laboratory' },
  { id: 'loc-staff-room', name: 'Staff Room',      building: 'Main Building', floor: 'Second Floor', access_type: 'restricted', floor_plan_id: 'mb-f2', room_id: 'staff',        description: 'Faculty staff room' },
  { id: 'loc-principal',  name: 'Principal Office',building: 'Main Building', floor: 'Ground Floor', access_type: 'restricted', floor_plan_id: 'mb-gf', room_id: 'principal',    description: 'Principal office' },
  { id: 'loc-library',    name: 'Library',         building: 'Main Building', floor: 'Ground Floor', access_type: 'authorized', floor_plan_id: 'mb-gf', room_id: 'library',      description: 'Campus library' },
  { id: 'loc-canteen',    name: 'Canteen',         building: 'Main Building', floor: 'Ground Floor', access_type: 'public',     floor_plan_id: 'mb-gf', room_id: 'canteen',      description: 'Canteen at compound wall' },
  { id: 'loc-comp-lab',   name: 'Computer Lab',    building: 'Main Building', floor: 'First Floor',  access_type: 'authorized', floor_plan_id: 'mb-f1', room_id: 'comp2',        description: 'General computer lab' },
];

// Cameras. integration_type = 'simulated' for the prototype (no real CCTV).
const CAMERAS = [
  { id: 'cam-01', camera_identifier: 'CAM-01', camera_name: 'Reception Camera',      camera_location: 'Main Reception',  location_id: 'loc-reception',  floor_plan_id: 'mb-gf', room_id: 'help-desk' },
  { id: 'cam-02', camera_identifier: 'CAM-02', camera_name: 'Meeting Room Camera',   camera_location: 'Meeting Room',    location_id: 'loc-meeting',    floor_plan_id: 'mb-gf', room_id: 'board-room' },
  { id: 'cam-03', camera_identifier: 'CAM-03', camera_name: 'CSE Lab Camera',        camera_location: 'CSE Laboratory',  location_id: 'loc-cse-lab',    floor_plan_id: 'mb-f1', room_id: 'comp1' },
  { id: 'cam-04', camera_identifier: 'CAM-04', camera_name: 'Staff Room Camera',     camera_location: 'Staff Room',      location_id: 'loc-staff-room', floor_plan_id: 'mb-f2', room_id: 'staff' },
  { id: 'cam-05', camera_identifier: 'CAM-05', camera_name: 'Library Camera',        camera_location: 'Library',         location_id: 'loc-library',    floor_plan_id: 'mb-gf', room_id: 'library' },
  { id: 'cam-06', camera_identifier: 'CAM-06', camera_name: 'Principal Office Cam',  camera_location: 'Principal Office',location_id: 'loc-principal',  floor_plan_id: 'mb-gf', room_id: 'principal' },
];

// Access rules. subject_type 'visitor' keys off visitor_type;
// subject_type 'user' keys off the user role.
const ACCESS_RULES = [
  // Parents: reception, meeting room, canteen allowed; everything else restricted.
  { location_id: 'loc-reception',  subject_type: 'visitor', subject_role: 'parent',    access_status: 'allowed' },
  { location_id: 'loc-meeting',    subject_type: 'visitor', subject_role: 'parent',    access_status: 'allowed' },
  { location_id: 'loc-canteen',    subject_type: 'visitor', subject_role: 'parent',    access_status: 'allowed' },
  { location_id: 'loc-cse-lab',    subject_type: 'visitor', subject_role: 'parent',    access_status: 'restricted' },
  { location_id: 'loc-staff-room', subject_type: 'visitor', subject_role: 'parent',    access_status: 'restricted' },
  { location_id: 'loc-principal',  subject_type: 'visitor', subject_role: 'parent',    access_status: 'restricted' },
  { location_id: 'loc-library',    subject_type: 'visitor', subject_role: 'parent',    access_status: 'restricted' },
  // Generic visitors: reception only.
  { location_id: 'loc-reception',  subject_type: 'visitor', subject_role: 'visitor',   access_status: 'allowed' },
  { location_id: 'loc-cse-lab',    subject_type: 'visitor', subject_role: 'visitor',   access_status: 'restricted' },
  { location_id: 'loc-staff-room', subject_type: 'visitor', subject_role: 'visitor',   access_status: 'restricted' },
  // Recruiters: reception, meeting room, principal office.
  { location_id: 'loc-reception',  subject_type: 'visitor', subject_role: 'recruiter', access_status: 'allowed' },
  { location_id: 'loc-meeting',    subject_type: 'visitor', subject_role: 'recruiter', access_status: 'allowed' },
  { location_id: 'loc-principal',  subject_type: 'visitor', subject_role: 'recruiter', access_status: 'allowed' },
  { location_id: 'loc-cse-lab',    subject_type: 'visitor', subject_role: 'recruiter', access_status: 'restricted' },
  { location_id: 'loc-staff-room', subject_type: 'visitor', subject_role: 'recruiter', access_status: 'restricted' },
  // Users.
  { location_id: 'loc-cse-lab',    subject_type: 'user', subject_role: 'student', access_status: 'allowed' },
  { location_id: 'loc-staff-room', subject_type: 'user', subject_role: 'student', access_status: 'restricted' },
  { location_id: 'loc-staff-room', subject_type: 'user', subject_role: 'faculty', access_status: 'allowed' },
  { location_id: 'loc-principal',  subject_type: 'user', subject_role: 'faculty', access_status: 'restricted' },
];

const USERS = [
  { full_name: 'Campus Admin',    email: 'admin@campus.edu',    role: 'admin',      password: 'admin123',    college_id: 'ADM-001', department: 'Administration' },
  { full_name: 'Security Officer',email: 'security@campus.edu', role: 'security',   password: 'security123', college_id: 'SEC-001', department: 'Security' },
  { full_name: 'Dr. Faculty',     email: 'faculty@campus.edu',  role: 'faculty',    password: 'faculty123',  college_id: 'FAC-001', department: 'Computer Science' },
  { full_name: 'Student User',    email: 'student@campus.edu',  role: 'student',    password: 'student123',  college_id: 'STU-001', department: 'Computer Science' },
];

export async function seedIfEmpty() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n > 0) return { seeded: false };

  // users
  for (const u of USERS) {
    await query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role, college_id, department, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
      [uid(), u.full_name, u.email, null, bcrypt.hashSync(u.password, 10), u.role, u.college_id, u.department]
    );
  }
  const securityUser = await query(`SELECT id FROM users WHERE role='security' LIMIT 1`);
  const securityUserId = securityUser.rows[0]?.id ?? null;

  // locations
  for (const l of LOCATIONS) {
    await query(
      `INSERT INTO locations (id, name, building, floor, description, access_type, floor_plan_id, room_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
      [l.id, l.name, l.building, l.floor, l.description, l.access_type, l.floor_plan_id, l.room_id]
    );
  }

  // access rules
  for (const r of ACCESS_RULES) {
    await query(
      `INSERT INTO access_rules (id, location_id, subject_type, subject_role, access_status)
       VALUES ($1,$2,$3,$4,$5)`,
      [uid(), r.location_id, r.subject_type, r.subject_role, r.access_status]
    );
  }

  // cameras (simulated)
  for (const c of CAMERAS) {
    await query(
      `INSERT INTO cameras (id, camera_name, camera_location, location_id, status, provider, integration_type, stream_url, camera_identifier, floor_plan_id, room_id, is_active)
       VALUES ($1,$2,$3,$4,'online','Campus Simulator','simulated',NULL,$5,$6,$7,TRUE)`,
      [c.id, c.camera_name, c.camera_location, c.location_id, c.camera_identifier, c.floor_plan_id, c.room_id]
    );
  }

  // Demo visitor: Ravi Kumar (parent), authorized for Meeting Room.
  const raviId = uid();
  await query(
    `INSERT INTO visitors (id, visitor_code, full_name, mobile_number, visitor_type, visiting_student_id, purpose, authorized_location_id, entry_time, expected_exit_time, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(), now() + interval '4 hours', 'active', $9)`,
    [raviId, 'VIS-RAVI01', 'Ravi Kumar', '9876543210', 'parent', 'STU-001', 'Meet ward\'s mentor', 'loc-meeting', securityUserId]
  );
  await query(
    `INSERT INTO face_profiles (id, person_id, visitor_id, provider, external_face_reference, verification_status, enrolled_at)
     VALUES ($1,$2,$3,'simulated',$4,'verified', now())`,
    [uid(), raviId, raviId, `FACE-REF-${raviId.slice(0, 8).toUpperCase()}`]
  );

  return { seeded: true, demoVisitorCode: 'VIS-RAVI01' };
}
