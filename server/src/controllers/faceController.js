import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { asyncHandler } from '../utils/errors.js';
import { enrollPerson, verifyPerson } from '../services/FaceVerificationService.js';

const enrollSchema = z.object({
  visitorId: z.string().optional().nullable(),
  personId: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
});

const verifySchema = z.object({
  visitorId: z.string().optional().nullable(),
  personId: z.string().optional().nullable(),
  externalFaceReference: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
});

export const enroll = asyncHandler(async (req, res) => {
  const data = validate(enrollSchema, req.body);
  const result = await enrollPerson({
    visitorId: data.visitorId ?? null,
    personId: data.personId ?? null,
    provider: data.provider ?? undefined,
  });
  res.status(201).json(result);
});

export const verify = asyncHandler(async (req, res) => {
  const data = validate(verifySchema, req.body);
  const result = await verifyPerson({
    visitorId: data.visitorId ?? null,
    personId: data.personId ?? null,
    externalFaceReference: data.externalFaceReference ?? null,
    provider: data.provider ?? undefined,
  });
  res.json(result);
});
