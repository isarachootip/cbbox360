import { Router } from 'express';
import { z } from 'zod';
import { industryKindSchema } from '../../shared/industrySchemas.js';
import { createIndustryProfileService } from '../services/industryProfileService.js';
import { industryProfileRepository } from '../repositories/industryProfileRepository.js';
import { writeAuditLog } from '../services/auditService.js';

// Mounted under requireAuth at /api/customers
const router = Router();
const service = createIndustryProfileService({ repo: industryProfileRepository, audit: writeAuditLog });

const paramsSchema = z.object({
  customerId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  kind: industryKindSchema,
});

const STATUS_BY_CODE = { INVALID_PROFILE: 400, KIND_MISMATCH: 400, FORBIDDEN: 403, FORBIDDEN_FIELDS: 403 };

const withParams = (handler) => async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ success: false, error: 'INVALID_PARAMS' });
  try {
    return await handler(req, res, params.data);
  } catch (err) {
    console.error('[Industry Profile Error]:', err.message);
    return res.status(503).json({ success: false, error: 'PROFILE_UNAVAILABLE' });
  }
};

router.get(
  '/:customerId/industry-profile/:kind',
  withParams(async (req, res, { customerId, kind }) => {
    const result = await service.getProfile(req.user, customerId, kind, req.ip);
    return res.status(200).json({ success: true, access: result.access, profile: result.profile });
  })
);

router.put(
  '/:customerId/industry-profile/:kind',
  withParams(async (req, res, { customerId, kind }) => {
    const result = await service.saveProfile(req.user, customerId, kind, req.body?.profile, req.ip);
    if (result.status !== 'ok') {
      return res.status(STATUS_BY_CODE[result.code] ?? 400).json({ success: false, error: result.code, ...result });
    }
    return res.status(200).json({ success: true, profile: result.profile });
  })
);

export default router;
