/**
 * modules/order-tracking/manifest.js — E-commerce Order & Shipment Tracking Module.
 * Demonstrates adding a new vertical module without modifying any file in `core/`.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ordersByTenant = new Map();

export const orderTrackingServerManifest = {
  id: 'order-tracking',
  version: '1.0.0',
  requiredEntitlement: 'module:order-tracking',
  migrationsPath: path.join(__dirname, 'migrations'),
  permissions: [
    { code: 'order:read', name: 'ดูสถานะคำสั่งซื้อและเลขพัสดุ' },
    { code: 'order:write', name: 'อัปเดตสถานะจัดส่งและคืนสินค้า' },
  ],
  registerRoutes(router) {
    router.get('/orders', (_req, res) => {
      const tenantId = getCurrentTenantId();
      res.status(200).json({ success: true, orders: ordersByTenant.get(tenantId) || [] });
    });

    router.post('/orders', (req, res) => {
      const tenantId = getCurrentTenantId();
      const list = ordersByTenant.get(tenantId) || [];
      const created = {
        id: `ord_${Date.now()}`,
        tenantId,
        contactId: String(req.body?.contactId || ''),
        orderCode: String(req.body?.orderCode || `ORD-${list.length + 1}`),
        trackingNumber: String(req.body?.trackingNumber || ''),
        totalAmount: Number(req.body?.totalAmount || 0),
        status: 'Open',
      };
      ordersByTenant.set(tenantId, [created, ...list]);
      res.status(201).json({ success: true, order: created });
    });
  },
  async resolveTemplateVariables({ tenantId, contactId }) {
    const list = ordersByTenant.get(tenantId) || [];
    const latest = list.find((o) => o.contactId === contactId);
    if (!latest) return {};
    return {
      order_code: latest.orderCode,
      tracking_no: latest.trackingNumber,
    };
  },
};
