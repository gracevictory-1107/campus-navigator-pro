-- =============================================================
-- Campus Navigator Pro — PostgreSQL schema
-- Visitor security monitoring via CCTV-based location detection.
--
-- Design notes:
--   * NO checkpoints table. NO QR-related tables. CCTV is the
--     location source (see visitor_location_events.detection_method).
--   * IDs are TEXT (application-generated UUIDs) for portability.
--   * Enum-like columns use TEXT + CHECK constraints.
--   * No biometric data is stored: face_profiles keeps only a
--     provider reference / simulated external identifier.
--   * Written to run on real PostgreSQL and on the pg-mem
--     in-memory fallback used for local demos.
-- =============================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','faculty','staff','management','security','admin')),
  college_id    TEXT,
  department    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- locations ----------
CREATE TABLE IF NOT EXISTS locations (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  building      TEXT,
  floor         TEXT,
  description   TEXT,
  access_type   TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public','authorized','restricted')),
  -- Map integration with the existing frontend floor plans (optional):
  floor_plan_id TEXT,
  room_id       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- visitors ----------
CREATE TABLE IF NOT EXISTS visitors (
  id                    TEXT PRIMARY KEY,
  visitor_code          TEXT NOT NULL UNIQUE,
  full_name             TEXT NOT NULL,
  mobile_number         TEXT,
  visitor_type          TEXT NOT NULL CHECK (visitor_type IN ('parent','visitor','recruiter')),
  visiting_student_id   TEXT,
  purpose               TEXT,
  authorized_location_id TEXT REFERENCES locations(id),
  entry_time            TIMESTAMPTZ,
  expected_exit_time    TIMESTAMPTZ,
  exit_time             TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','exited','blocked')),
  created_by            TEXT REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- access_rules ----------
CREATE TABLE IF NOT EXISTS access_rules (
  id            TEXT PRIMARY KEY,
  location_id   TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  subject_type  TEXT NOT NULL CHECK (subject_type IN ('user','visitor')),
  subject_role  TEXT NOT NULL CHECK (subject_role IN ('student','faculty','staff','management','security','admin','parent','visitor','recruiter')),
  access_status TEXT NOT NULL CHECK (access_status IN ('allowed','restricted')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- cameras ----------
CREATE TABLE IF NOT EXISTS cameras (
  id                 TEXT PRIMARY KEY,
  camera_name        TEXT NOT NULL,
  camera_location    TEXT,
  location_id        TEXT REFERENCES locations(id),
  status             TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online','offline','maintenance')),
  provider           TEXT,
  integration_type   TEXT NOT NULL DEFAULT 'simulated' CHECK (integration_type IN ('simulated','onvif','api','sdk','rtsp','vms')),
  stream_url         TEXT,
  camera_identifier  TEXT NOT NULL UNIQUE,
  -- Map integration with the existing frontend floor plans (optional):
  floor_plan_id      TEXT,
  room_id            TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- face_profiles ----------
-- Prototype only: stores a provider reference, NEVER raw photos/templates.
CREATE TABLE IF NOT EXISTS face_profiles (
  id                     TEXT PRIMARY KEY,
  person_id              TEXT,
  visitor_id             TEXT REFERENCES visitors(id) ON DELETE CASCADE,
  provider               TEXT NOT NULL DEFAULT 'simulated',
  external_face_reference TEXT NOT NULL,
  verification_status    TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  enrolled_at            TIMESTAMPTZ,
  last_verified_at       TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- visitor_location_events ----------
-- CCTV is the location source. detection_method is 'cctv' or 'manual'. NO QR.
CREATE TABLE IF NOT EXISTS visitor_location_events (
  id               TEXT PRIMARY KEY,
  person_id        TEXT,
  visitor_id       TEXT REFERENCES visitors(id) ON DELETE CASCADE,
  camera_id        TEXT REFERENCES cameras(id),
  location_id      TEXT REFERENCES locations(id),
  detection_method TEXT NOT NULL DEFAULT 'cctv' CHECK (detection_method IN ('cctv','manual')),
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence       REAL,
  access_status    TEXT CHECK (access_status IN ('authorized','restricted')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- security_alerts ----------
CREATE TABLE IF NOT EXISTS security_alerts (
  id              TEXT PRIMARY KEY,
  person_id       TEXT,
  visitor_id      TEXT REFERENCES visitors(id) ON DELETE CASCADE,
  location_id     TEXT REFERENCES locations(id),
  camera_id       TEXT REFERENCES cameras(id),
  alert_type      TEXT NOT NULL CHECK (alert_type IN ('restricted_access','unauthorized_movement','visitor_expired','unknown_person','manual')),
  severity        TEXT NOT NULL DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_by TEXT REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by     TEXT REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- indexes (real Postgres; ignored harmlessly elsewhere) ----------
CREATE INDEX IF NOT EXISTS idx_events_visitor   ON visitor_location_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_person    ON visitor_location_events(person_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status    ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_visitor   ON security_alerts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rules_location   ON access_rules(location_id);
CREATE INDEX IF NOT EXISTS idx_cameras_location ON cameras(location_id);
