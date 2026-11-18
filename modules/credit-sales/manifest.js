/**
 * modules/credit-sales/manifest.js — B2B Wholesale & Credit Control Module.
 * Extracted out of Core so Hospital, Insurance, and other tenants have zero B2B credit coupling.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { registerDefaultRolePreset } from '../../core/shared/permissions.js';
import { registerDefaultTenantEntitlement } from '../../core/server/entitlements/entitlementService.js';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register B2B finance role permissions & default workspace compatibility outside Core
registerDefaultRolePreset('SF_3', ['credit:read', 'credit:write']);
registerDefaultTenantEntitlement('module:credit-sales', true);

const inMemoryAccountsByTenant = new Map();

export const creditSalesServerManifest = {
  id: 'credit-sales',
  version: '1.0.0',
  requiredEntitlement: 'module:credit-sales',
  migrationsPath: path.join(__dirname, 'migrations'),
  permissions: [
    { code: 'credit:read', name: 'ดูข้อมูลวงเงินเครดิตและ Aging ลูกหนี้' },
    { code: 'credit:write', name: 'อนุมัติ/ปฏิเสธการขอปรับเพิ่มวงเงินเครดิต' },
  ],
  registerRoutes(router) {
    router.get('/accounts', (_req, res) => {
      const tenantId = getCurrentTenantId();
      const accounts = inMemoryAccountsByTenant.get(tenantId) || [];
      res.status(200).json({ success: true, tenantId, accounts });
    });

    router.post('/accounts', (req, res) => {
      const tenantId = getCurrentTenantId();
      const current = inMemoryAccountsByTenant.get(tenantId) || [];
      const nextItem = {
        id: req.body?.id || `cr_acc_${Date.now()}`,
        contactId: String(req.body?.contactId || ''),
        creditLimit: Number(req.body?.creditLimit || 0),
        creditUsed: Number(req.body?.creditUsed || 0),
        overdueAmount: Number(req.body?.overdueAmount || 0),
      };
      inMemoryAccountsByTenant.set(tenantId, [...current, nextItem]);
      res.status(201).json({ success: true, account: nextItem });
    });
  },
  async resolveTemplateVariables() {
    return { credit_term: '30 วัน' };
  },
};
