import { z } from 'zod';
import { consentRepository } from '../repositories/consentRepository.js';
import { writeAuditLog } from '../services/auditService.js';

const consentSourceSchema = z.enum([
  'LINE LIFF',
  'Web Form',
  '3CX Call',
  'Walk-in',
  'Email',
  'Admin',
]);

export const serverDsrSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  customerId: z.string().min(1).max(40),
  customerName: z.string().min(1).max(200),
  requestType: z.enum([
    'ACCESS_EXPORT',
    'WITHDRAW_CONSENT',
    'RECTIFICATION',
    'ERASURE_ANONYMIZE',
  ]),
  channel: consentSourceSchema,
  reason: z.string().max(1000),
  status: z.enum(['Open', 'In Review', 'Completed', 'Overdue']),
  slaDaysLeft: z.number(),
  assignee: z.string().max(120),
  createdAt: z.string().max(60),
  resolvedAt: z.string().max(60).optional(),
  resolutionNote: z.string().max(1000).optional(),
});

export const serverPolicySchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_.-]{1,60}$/),
  version: z.string().min(1).max(30),
  title: z.string().min(1).max(240),
  effectiveDate: z.string().min(1).max(40),
  summary: z.string().max(2000),
  lineConsentMessage: z.string().max(2000),
  isActive: z.boolean(),
});

export const createConsentController = ({ repo, audit }) => ({
  async getOverview(_req, res) {
    try {
      const [dsrRequests, policies] = await Promise.all([
        repo.listDsr(),
        repo.listPolicies(),
      ]);
      return res.status(200).json({ success: true, dsrRequests, policies });
    } catch (err) {
      console.error('[Consent Overview Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CONSENT_SERVICE_UNAVAILABLE' });
    }
  },

  async upsertDsr(req, res) {
    const parsed = serverDsrSchema.safeParse(req.body?.dsrRequest);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'INVALID_DSR_PAYLOAD' });
    }
    try {
      const saved = await repo.upsertDsr(parsed.data);
      await audit({
        userId: req.user?.id ?? 'system',
        userRole: req.user?.role,
        action: 'UPSERT_DSR_REQUEST',
        category: 'data',
        resource: `DSR/${saved.id} (${saved.customerId})`,
        ip: req.ip,
        details: `${saved.requestType} -> ${saved.status}`,
      });
      return res.status(200).json({ success: true, dsrRequest: saved });
    } catch (err) {
      console.error('[Consent DSR Save Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CONSENT_SERVICE_UNAVAILABLE' });
    }
  },

  async upsertPolicy(req, res) {
    const parsed = serverPolicySchema.safeParse(req.body?.policy);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'INVALID_POLICY_PAYLOAD' });
    }
    try {
      const saved = await repo.upsertPolicy(parsed.data);
      await audit({
        userId: req.user?.id ?? 'system',
        userRole: req.user?.role,
        action: 'UPSERT_CONSENT_POLICY',
        category: 'system',
        resource: `ConsentPolicy/${saved.version}`,
        ip: req.ip,
        details: `${saved.title} (active=${saved.isActive})`,
      });
      return res.status(200).json({ success: true, policy: saved });
    } catch (err) {
      console.error('[Consent Policy Save Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CONSENT_SERVICE_UNAVAILABLE' });
    }
  },
});

export const defaultConsentController = createConsentController({
  repo: consentRepository,
  audit: writeAuditLog,
});
