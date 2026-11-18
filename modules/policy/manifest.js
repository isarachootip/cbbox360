/**
 * modules/policy/manifest.js — Insurance Policy Portfolio & Renewal Tracking Module.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createPolicySchema = z.object({
  contactId: z.string().trim().min(1),
  policyNumber: z.string().trim().min(3),
  policyType: z.string().trim().min(2),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agentName: z.string().trim().optional(),
  sumInsured: z.number().nonnegative().default(0),
});

const policiesByTenant = new Map();

export const policyServerManifest = {
  id: 'policy',
  version: '1.0.0',
  requiredEntitlement: 'module:policy',
  migrationsPath: path.join(__dirname, 'migrations'),
  permissions: [
    { code: 'policy:read', name: 'ดูข้อมูลกรมธรรม์และความคุ้มครอง' },
    { code: 'policy:write', name: 'บันทึก/สลักหลัง/ต่ออายุกรมธรรม์' },
  ],
  registerRoutes(router) {
    router.get('/policies', (req, res) => {
      const tenantId = getCurrentTenantId();
      const contactId = req.query?.contactId ? String(req.query.contactId) : null;
      const list = policiesByTenant.get(tenantId) || [];
      const filtered = contactId ? list.filter((p) => p.contactId === contactId) : list;
      return res.status(200).json({ success: true, policies: filtered });
    });

    router.post('/policies', (req, res) => {
      const parsed = createPolicySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'INVALID_POLICY' });
      }
      const tenantId = getCurrentTenantId();
      const list = policiesByTenant.get(tenantId) || [];
      if (list.some((p) => p.policyNumber.toLowerCase() === parsed.data.policyNumber.toLowerCase())) {
        return res.status(409).json({ success: false, error: 'DUPLICATE_POLICY_NUMBER' });
      }
      const created = {
        id: `pol_${Date.now()}_${list.length + 1}`,
        tenantId,
        ...parsed.data,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      policiesByTenant.set(tenantId, [created, ...list]);
      return res.status(201).json({ success: true, policy: created });
    });
  },
  async resolveTemplateVariables({ tenantId, contactId }) {
    const list = policiesByTenant.get(tenantId) || [];
    const active = list.find((p) => p.contactId === contactId && p.status === 'Active');
    if (!active) return {};
    return {
      policy_number: active.policyNumber,
      policy_expiry: active.expiryDate,
    };
  },
};
