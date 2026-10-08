import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { asyncHandler } from '../utils/errors.js';
import { processCCTVDetection } from '../services/CCTVLocationService.js';

const detectionSchema = z.object({
  cameraId: z.string().min(1),
  personId: z.string().optional().nullable(),
  visitorId: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * POST /api/cctv/detection — real detection ingest point (would be fed by the
 * video-analytics pipeline). Also used by the dev simulator.
 */
export const detection = asyncHandler(async (req, res) => {
  const data = validate(detectionSchema, req.body);
  const result = await processCCTVDetection({
    cameraId: data.cameraId,
    personId: data.personId ?? null,
    visitorId: data.visitorId ?? null,
    timestamp: data.timestamp ?? null,
    confidence: data.confidence ?? 0.95,
    detectionMethod: 'cctv',
  });
  res.json(result);
});

/**
 * POST /api/cctv/simulate-detection — DEVELOPMENT ONLY convenience wrapper.
 * Same pipeline as `detection`, kept separate so it can be disabled in prod.
 */
export const simulateDetection = asyncHandler(async (req, res) => {
  const data = validate(detectionSchema, req.body);
  const result = await processCCTVDetection({
    cameraId: data.cameraId,
    personId: data.personId ?? null,
    visitorId: data.visitorId ?? null,
    timestamp: data.timestamp ?? null,
    confidence: data.confidence ?? 0.9,
    detectionMethod: 'cctv',
  });
  res.json({ simulated: true, ...result });
});
