import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET, authenticate, requireRole } from '../middleware/auth.js';
import { ApiError } from '../utils/errors.js';

import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as visitors from '../controllers/visitorController.js';
import * as face from '../controllers/faceController.js';
import * as locations from '../controllers/locationController.js';
import * as accessRules from '../controllers/accessRuleController.js';
import * as cameras from '../controllers/cameraController.js';
import * as cctv from '../controllers/cctvController.js';
import * as alerts from '../controllers/alertController.js';
import * as events from '../controllers/eventController.js';
import * as locationEvents from '../controllers/locationEventController.js';

const router = Router();

// Roles allowed to mutate security data / run detections.
const SEC_ADMIN = ['security', 'admin'];
// Roles allowed to read security data (management gets read-only visibility).
const SEC_VIEW = ['security', 'admin', 'management'];

// SSE cannot set an Authorization header, so accept a token via query string.
function authenticateQuery(req, _res, next) {
  const token = req.query.token;
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// ---------- AUTH ----------
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.me);
// ---------- USERS (admin only) ----------
router.get('/users', authenticate, requireRole('admin'), users.listUsers);
router.put('/users/:id', authenticate, requireRole('admin'), users.updateUser);

// ---------- VISITORS (security/admin) ----------
router.get('/visitors', authenticate, requireRole(...SEC_ADMIN), visitors.listVisitors);
router.post('/visitors', authenticate, requireRole(...SEC_ADMIN), visitors.createVisitor);
router.get('/visitors/:id', authenticate, requireRole(...SEC_ADMIN), visitors.getVisitor);
router.put('/visitors/:id', authenticate, requireRole(...SEC_ADMIN), visitors.updateVisitor);
router.post('/visitors/:id/check-in', authenticate, requireRole(...SEC_ADMIN), visitors.checkIn);
router.post('/visitors/:id/check-out', authenticate, requireRole(...SEC_ADMIN), visitors.checkOut);

// ---------- FACE (security/admin) ----------
router.post('/face/enroll', authenticate, requireRole(...SEC_ADMIN), face.enroll);
router.post('/face/verify', authenticate, requireRole(...SEC_ADMIN), face.verify);

// ---------- LOCATIONS ----------
router.get('/locations', authenticate, locations.listLocations);
router.post('/locations', authenticate, requireRole(...SEC_ADMIN), locations.createLocation);
router.put('/locations/:id', authenticate, requireRole(...SEC_ADMIN), locations.updateLocation);
router.delete('/locations/:id', authenticate, requireRole('admin'), locations.deleteLocation);

// ---------- ACCESS RULES (security/admin) ----------
router.get('/access-rules', authenticate, requireRole(...SEC_ADMIN), accessRules.listRules);
router.post('/access-rules', authenticate, requireRole(...SEC_ADMIN), accessRules.createRule);
router.put('/access-rules/:id', authenticate, requireRole(...SEC_ADMIN), accessRules.updateRule);
router.delete('/access-rules/:id', authenticate, requireRole(...SEC_ADMIN), accessRules.deleteRule);

// ---------- CAMERAS (security/admin) ----------
router.get('/cameras', authenticate, requireRole(...SEC_VIEW), cameras.listCameras);
router.post('/cameras', authenticate, requireRole(...SEC_ADMIN), cameras.createCamera);
router.put('/cameras/:id', authenticate, requireRole(...SEC_ADMIN), cameras.updateCamera);
router.delete('/cameras/:id', authenticate, requireRole(...SEC_ADMIN), cameras.deleteCamera);
router.get('/cameras/:id/status', authenticate, requireRole(...SEC_VIEW), cameras.cameraStatus);
router.get('/cameras/:id/stream', authenticate, requireRole(...SEC_VIEW), cameras.cameraStream);

// ---------- CCTV DETECTION (security/admin) ----------
router.post('/cctv/detection', authenticate, requireRole(...SEC_ADMIN), cctv.detection);
// Development-only simulator. Disabled in production unless explicitly enabled.
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SIMULATION === 'true') {
  router.post('/cctv/simulate-detection', authenticate, requireRole(...SEC_ADMIN), cctv.simulateDetection);
}

// ---------- LOCATION EVENTS (security/admin/management read) ----------
router.get('/location-events', authenticate, requireRole(...SEC_VIEW), locationEvents.listEvents);
router.get('/location-events/:personId', authenticate, requireRole(...SEC_VIEW), locationEvents.eventsByPerson);

// ---------- ALERTS ----------
router.get('/alerts', authenticate, requireRole(...SEC_VIEW), alerts.listAlerts);
router.get('/alerts/:id', authenticate, requireRole(...SEC_VIEW), alerts.getAlert);
router.put('/alerts/:id/acknowledge', authenticate, requireRole(...SEC_ADMIN), alerts.acknowledgeAlert);
router.put('/alerts/:id/resolve', authenticate, requireRole(...SEC_ADMIN), alerts.resolveAlert);

// ---------- REALTIME (SSE) ----------
router.get('/events/stream', authenticateQuery, requireRole(...SEC_VIEW), events.stream);

export default router;
