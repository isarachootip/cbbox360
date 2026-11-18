/**
 * modules/claim/manifest.js — Insurance FNOL Claim Intake & Settlement Module.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createClaimSchema = z.object({
  contactId: z.string().trim().min(1),
  policyNumber: z.string().trim().min(3),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  claimAmount: z.number().nonnegative(),
  adjusterNote: z.string().trim().optional(),
});

const claimsByTenant = new Map();

export const claimServerManifest = {
  id: 'claim',
  version: '1.0.0',
  requiredEntitlement: 'module:claim',
  migrationsPath: path.join(__dirname, 'migrations'),
  permissions: [
    { code: 'claim:read', name: 'ดูรายการเคลมสินไหม' },
    { code: 'claim:write', name: 'รับแจ้งเคลมและอัปเดตเอกสารสินไหม' },
    { code: 'claim:approve', name: 'อนุมัติ/ปฏิเสธการจ่ายสินไหมทดแทน' },
  ],
  registerRoutes(router) {
    router.get('/claims', (req, res) => {
      const tenantId = getCurrentTenantId();
      const contactId = req.query?.contactId ? String(req.query.contactId) : null;
      const list = claimsByTenant.get(tenantId) || [];
      const filtered = contactId ? list.filter((c) => c.contactId === contactId) : list;
      return res.status(200).json({ success: true, claims: filtered });
    });

    router.post('/claims', (req, res) => {
      const parsed = createClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'INVALID_CLAIM' });
      }
      const tenantId = getCurrentTenantId();
      const list = claimsByTenant.get(tenantId) || [];
      const claimNumber = `CLM-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;
      const created = {
        id: `clm_${Date.now()}_${list.length + 1}`,
        tenantId,
        claimNumber,
        ...parsed.data,
        status: 'Open',
        createdAt: new Date().toISOString(),
      };
      claimsByTenant.set(tenantId, [created, ...list]);
      return res.status(201).json({ success: true, claim: created });
    });
  },
  registerEventHandlers(bus) {
    bus.subscribe('case.created', async (evt) => {
      if (evt.payload?.categorySlug !== 'claim') return;
      const list = claimsByTenant.get(evt.tenantId) || [];
      const claimNumber = `CLM-AUTO-${list.length + 1}`;
      claimsByTenant.set(evt.tenantId, [
        {
          id: `clm_auto_${Date.now()}`,
          tenantId: evt.tenantId,
          claimNumber,
          contactId: String(evt.payload.contactId || ''),
          policyNumber: String(evt.payload.policyNumber || 'PENDING'),
          incidentDate: new Date().toISOString().slice(0, 10),
          claimAmount: 0,
          status: 'Open',
        },
        ...list,
      ]);
    });
  },
};
