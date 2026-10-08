# Campus Navigator Pro — Backend

Node.js + Express + PostgreSQL backend for the campus navigation and **visitor
security monitoring** system. Location detection is **CCTV-based** — there is no
QR / checkpoint system anywhere in this project.

> **Prototype disclaimer.** CCTV integration is **simulated**
> (`integration_type = 'simulated'`). No real college camera network is connected,
> and no real video-analytics or face-biometric matching is performed. Face
> verification stores only a **provider reference** string — never a photo or a
> biometric template. All access decisions are made **on the backend**; the
> frontend is never trusted to authorize anyone.

---

## 1. Architecture

```
server/
  src/
    config/       schema.sql, db.js (pg + pg-mem fallback), seed.js
    controllers/  HTTP handlers (auth, visitors, face, locations, access-rules,
                  cameras, cctv, alerts, events, location-events, users)
    middleware/   auth.js (JWT verify + requireRole)
    models/       (reserved)
    routes/       index.js — all endpoints + role guards
    services/     AccessControlService, CCTVLocationService,
                  FaceVerificationService, CCTVProviderService
    utils/        errors, events (SSE bus), ids, validate (zod)
    app.js        Express app (helmet, cors, rate limits, error handler)
    server.js     bootstrap: seedIfEmpty() then listen
  .env.example
  package.json
```

**Request flow for a detection**

```
CCTV camera (simulated) ──▶ POST /api/cctv/simulate-detection
   └─ CCTVLocationService.processCCTVDetection()
        ├─ resolve camera → location
        ├─ AccessControlService.checkPersonAccess()   ← the ONLY place access is decided
        ├─ insert visitor_location_event (access_status: authorized | restricted)
        ├─ if restricted → create HIGH severity security_alert
        └─ publish SSE 'detection' + 'alert' → dashboards update live (no refresh)
```

The backend is **independent** from the frontend: it exposes a JSON REST API plus
a Server-Sent Events (SSE) stream, and knows nothing about React.

---

## 2. Install & run

```bash
cd server
cp .env.example .env      # then edit values (at minimum set JWT_SECRET)
npm install
npm run dev               # or: npm start
# API base: http://localhost:4000/api
```

On first boot the server **seeds demo data** (only when the `users` table is
empty): demo accounts, locations, cameras, access rules, and the demo visitor
**Ravi Kumar (VIS-RAVI01, parent)**.

### Database modes

| Mode | When | Notes |
|------|------|-------|
| **In-memory (pg-mem)** | `DATABASE_URL` empty **or** `DB_DRIVER=memory` | Zero-install demo. Data resets on restart. Uses the same parameterized SQL as real Postgres. |
| **PostgreSQL** | `DATABASE_URL` set | `createdb campus_navigator`, set the URL, restart. `schema.sql` is applied automatically on boot. |

The schema (`src/config/schema.sql`) contains **8 tables**: `users`, `locations`,
`visitors`, `access_rules`, `cameras`, `face_profiles`, `visitor_location_events`,
`security_alerts`. **There is no `checkpoints` table and no QR-related table.**

---

## 3. Environment variables

| Var | Purpose |
|-----|---------|
| `PORT` | HTTP port (default 4000). |
| `NODE_ENV` | `development` / `production`. |
| `CORS_ORIGIN` | Comma-separated allowed browser origins. |
| `DATABASE_URL` | Postgres connection string. Empty → in-memory pg-mem. |
| `DB_DRIVER` | Force `memory` to always use pg-mem. |
| `JWT_SECRET` | **Required in production.** Long random string. Never commit. |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`). |
| `FACE_PROVIDER` | Label for the simulated face provider. |
| `ENABLE_SIMULATION` | Keep the CCTV simulator enabled in production (`true`). |

**Never** hardcode or commit database passwords, JWT secrets, camera credentials,
private IP addresses, or service-account keys. Real CCTV credentials would live
only in server-side env/secret storage, never in the database or frontend.

---

## 4. Authentication & roles

`POST /api/auth/login` returns `{ user, token }`. Send the token as
`Authorization: Bearer <token>` on every request. The SSE stream cannot set
headers, so it accepts `?token=<jwt>` as a query parameter.

**User roles:** `student`, `faculty`, `staff`, `management`, `security`, `admin`.
**Visitor types:** `parent`, `visitor`, `recruiter`.

| Capability | Roles |
|------------|-------|
| Read locations | any authenticated user |
| Visitor DB, face, CCTV detection, access rules, alert ack/resolve | `security`, `admin` |
| Read-only security visibility (cameras, alerts, events, SSE) | `security`, `admin`, `management` |
| User & location management | `admin` |

`student` / `faculty` are blocked (403) from all visitor and security data.

---

## 5. Endpoints

All paths are prefixed with `/api`.

**Auth**
- `POST /auth/register` · `POST /auth/login` · `GET /auth/me`

**Users (admin)**
- `GET /users` · `PUT /users/:id` (change `role` / `is_active`)

**Visitors (security/admin)**
- `GET /visitors` · `GET /visitors/:id` · `POST /visitors` · `PUT /visitors/:id`
- `POST /visitors/:id/check-in` · `POST /visitors/:id/check-out`

**Face (security/admin, simulated)**
- `POST /face/enroll` · `POST /face/verify`

**Locations**
- `GET /locations` · `POST /locations` · `PUT /locations/:id` · `DELETE /locations/:id` (admin)

**Access rules (security/admin)**
- `GET /access-rules` · `POST /access-rules` · `PUT /access-rules/:id` · `DELETE /access-rules/:id`

**Cameras (security/admin)**
- `GET /cameras` · `POST /cameras` · `PUT /cameras/:id` · `DELETE /cameras/:id`
- `GET /cameras/:id/status` · `GET /cameras/:id/stream`

**CCTV detection (security/admin)**
- `POST /cctv/detection` — production detection ingest
- `POST /cctv/simulate-detection` — dev simulator (disabled in production unless `ENABLE_SIMULATION=true`)

**Location events & alerts**
- `GET /location-events` · `GET /location-events/:personId`
- `GET /alerts` · `GET /alerts/:id` · `PUT /alerts/:id/acknowledge` · `PUT /alerts/:id/resolve`

**Realtime**
- `GET /events/stream?token=<jwt>` — SSE stream emitting `detection` and `alert` events.

`GET /api/health` returns service status.

---

## 6. Access-control logic

`AccessControlService.checkPersonAccess({ personId, visitorId, locationId })`
is the single source of truth. Resolution order:

1. **Explicit `access_rule`** for the subject (visitor type or user role) at that
   location — `allowed` or `restricted`. Most specific rule wins.
2. Otherwise fall back to the location's `access_type`:
   - `public` → allowed for everyone
   - `authorized` → allowed for the visitor's own `authorized_location_id`
   - `restricted` → denied

Result: `{ access: 'allowed' | 'restricted', status, color: 'green' | 'red', reason }`.

> **Colour = ACCESS STATUS ONLY.** Green = authorized, red = restricted. Colour is
> **never** derived from a visitor's type or role; type/role are shown separately.

A `restricted` result writes a `restricted` location event **and** raises a HIGH
severity `security_alert`, both pushed over SSE.

### Demo scenario

Ravi Kumar (parent) is authorized for the **Meeting Room** and **Reception**, and
restricted from the **CSE Lab** and **Staff Room**.

| Camera | Location | Ravi's result |
|--------|----------|---------------|
| CAM-01 | Reception | 🟢 authorized |
| CAM-02 | Meeting Room | 🟢 authorized (his destination) |
| CAM-03 | CSE Laboratory | 🔴 restricted → alert |
| CAM-04 | Staff Room | 🔴 restricted → alert |
| CAM-05 | Library | per rule |
| CAM-06 | Principal Office | per rule |

Each location carries `floor_plan_id` + `room_id` so the frontend can plot the
person on the **existing** campus floor plans (green/red marker) without changing
any room or route geometry.

---

## 7. Face verification (simulated)

- `POST /face/enroll` creates a `face_profiles` row holding only
  `external_face_reference` (e.g. `FACE-REF-XXXXXXXX`) and a provider label.
- `POST /face/verify` returns a simulated match: `{ verified, visitor, externalFaceReference, provider, simulated }`.
- **No photographs and no biometric templates are stored.** Swapping in a real,
  institution-approved provider means replacing `FaceVerificationService` and
  keeping the same reference-only contract.

---

## 8. Future real-CCTV integration

The `cameras.integration_type` column already supports `onvif`, `rtsp`, `api`,
`sdk`, `vms`, `simulated`. To go live:

1. Add a real adapter behind `CCTVProviderService` (streams, camera status, and a
   detection webhook) — credentials via server-side env/secrets only.
2. Point an analytics/face provider at `POST /api/cctv/detection`; the access
   decision, event logging, alerting, and SSE fan-out are unchanged.
3. Set `integration_type` per camera and disable the simulator
   (`NODE_ENV=production`, `ENABLE_SIMULATION` unset).

The rest of the system (access control, alerts, live map, dashboards) requires no
changes.

---

## 9. Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `--watch` (auto-reload). |
| `npm start` | Start the server. |
| `npm run seed` | Re-run the demo seeder. |
