/**
 * modules/appointment/manifest.js — Hospital Doctor Appointment & Triage Scheduling Module.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getCurrentTenantId } from '../../core/server/tenancy/tenantContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createAppointmentSchema = z.object({
  contactId: z.string().trim().min(1),
  hn: z.string().trim().optional(),
  department: z.string().trim().min(1),
  doctorName: z.string().trim().min(1),
  scheduledAt: z.string().trim().min(10),
  notes: z.string().trim().optional(),
});

const storeByTenant = new Map();

export const appointmentServerManifest = {
  id: 'appointment',
  version: '1.0.0',
  requiredEntitlement: 'module:appointment',
  migrationsPath: path.join(__dirname, 'migrations'),
  permissions: [
    { code: 'appointment:read', name: 'ดูตารางนัดหมายแพทย์' },
    { code: 'appointment:write', name: 'จอง/เลื่อน/ยกเลิกนัดหมายแพทย์' },
  ],
  registerRoutes(router) {
    router.get('/appointments', (req, res) => {
      const tenantId = getCurrentTenantId();
      const contactId = req.query?.contactId ? String(req.query.contactId) : null;
      const all = storeByTenant.get(tenantId) || [];
      const filtered = contactId ? all.filter((a) => a.contactId === contactId) : all;
      return res.status(200).json({ success: true, appointments: filtered });
    });

    router.post('/appointments', (req, res) => {
      const parsed = createAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'INVALID_APPOINTMENT' });
      }
      const tenantId = getCurrentTenantId();
      const all = storeByTenant.get(tenantId) || [];
      const created = {
        id: `apt_${Date.now()}_${all.length + 1}`,
        tenantId,
        ...parsed.data,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };
      storeByTenant.set(tenantId, [created, ...all]);
      return res.status(201).json({ success: true, appointment: created });
    });

    router.patch('/appointments/:id/status', (req, res) => {
      const tenantId = getCurrentTenantId();
      const status = String(req.body?.status || '');
      if (!['Confirmed', 'Pending', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, error: 'INVALID_STATUS' });
      }
      const all = storeByTenant.get(tenantId) || [];
      const next = all.map((a) => (a.id === req.params.id ? { ...a, status } : a));
      storeByTenant.set(tenantId, next);
      const updated = next.find((a) => a.id === req.params.id);
      if (!updated) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
      return res.status(200).json({ success: true, appointment: updated });
    });
  },
  async resolveTemplateVariables({ tenantId, contactId }) {
    const all = storeByTenant.get(tenantId) || [];
    const nextApt = all.find((a) => a.contactId === contactId && a.status === 'Confirmed');
    if (!nextApt) return {};
    return {
      appoint_date: nextApt.scheduledAt,
      doctor_name: nextApt.doctorName,
      department: nextApt.department,
    };
  },
};
