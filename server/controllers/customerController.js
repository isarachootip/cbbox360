import { z } from 'zod';
import { customerRepository } from '../repositories/customerRepository.js';
import { writeAuditLog } from '../services/auditService.js';

const contactPersonSchema = z.object({
  id: z.string(),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string(),
  roleOrTitle: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  lineId: z.string().optional(),
  isPrimary: z.boolean(),
  notes: z.string().optional(),
});

const addressSchema = z.object({
  id: z.string(),
  type: z.enum(['BILLING', 'SHIPPING', 'OFFICE', 'WAREHOUSE', 'BRANCH', 'OTHER']),
  title: z.string(),
  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  addressLine1: z.string(),
  subdistrict: z.string(),
  district: z.string(),
  province: z.string(),
  postalCode: z.string(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googlePlaceId: z.string().optional(),
  formattedAddress: z.string().optional(),
  mapUrl: z.string().optional(),
  isDefaultBilling: z.boolean().optional(),
  isDefaultShipping: z.boolean().optional(),
  deliveryNotes: z.string().optional(),
});

export const serverCustomerSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  name: z.string().min(1).max(200),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  contacts: z.array(contactPersonSchema).optional(),
  addresses: z.array(addressSchema).optional(),
  avatar: z.string().optional(),
  initials: z.string().max(10),
  tier: z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM']),
  creditGrade: z.enum(['A', 'B', 'C', 'D']),
  segments: z.array(z.string()),
  lifetimeValue: z.number(),
  spend12Months: z.number(),
  orders12Months: z.number(),
  lastOrderDaysAgo: z.number(),
  lastOrderCode: z.string(),
  lastOrderAmount: z.number(),
  tierValidUntil: z.string(),
  tierProgressPercent: z.number(),
  tierTargetSpend: z.number(),
  phone: z.string().min(1).max(60),
  fullPhone: z.string().min(1).max(60),
  email: z.string().max(200),
  channels: z.object({
    line: z.boolean(),
    facebook: z.boolean(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  }),
  birthday: z.string(),
  customerSince: z.string(),
  consent: z.object({
    marketingLine: z.boolean(),
    marketingEmail: z.boolean(),
    marketingSms: z.boolean(),
  }),
  creditLimit: z.number().min(0),
  creditUsed: z.number(),
  creditOverdue: z.number(),
  churnRisk: z.enum(['ต่ำ', 'ปานกลาง', 'สูง']),
  nextBestAction: z.object({
    description: z.string(),
    actionLabel: z.string(),
  }),
});

export const createCustomerController = ({ repo, audit }) => ({
  async listCustomers(_req, res) {
    try {
      const rows = await repo.listAll();
      return res.status(200).json({ success: true, customers: rows });
    } catch (err) {
      console.error('[Customer List Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CUSTOMER_SERVICE_UNAVAILABLE' });
    }
  },

  async createCustomer(req, res) {
    const parsed = serverCustomerSchema.safeParse(req.body?.customer);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'INVALID_CUSTOMER_PAYLOAD' });
    }
    try {
      const saved = await repo.upsert(parsed.data);
      await audit({
        userId: req.user?.id ?? 'system',
        userRole: req.user?.role,
        action: 'CREATE_CUSTOMER',
        category: 'data',
        resource: `Customer/${saved.id}`,
        ip: req.ip,
        details: `Created CDP customer ${saved.name} (${saved.customerType || 'INDIVIDUAL'})`,
      });
      return res.status(201).json({ success: true, customer: saved });
    } catch (err) {
      console.error('[Customer Create Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CUSTOMER_SERVICE_UNAVAILABLE' });
    }
  },

  async updateCustomer(req, res) {
    const paramId = String(req.params?.customerId || '');
    const parsed = serverCustomerSchema.safeParse(req.body?.customer);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'INVALID_CUSTOMER_PAYLOAD' });
    }
    if (paramId.toUpperCase() !== parsed.data.id.toUpperCase()) {
      return res.status(400).json({ success: false, error: 'ID_MISMATCH' });
    }
    try {
      const saved = await repo.upsert(parsed.data);
      await audit({
        userId: req.user?.id ?? 'system',
        userRole: req.user?.role,
        action: 'UPDATE_CUSTOMER',
        category: 'data',
        resource: `Customer/${saved.id}`,
        ip: req.ip,
        details: `Updated CDP customer ${saved.name}`,
      });
      return res.status(200).json({ success: true, customer: saved });
    } catch (err) {
      console.error('[Customer Update Error]:', err.message);
      return res.status(503).json({ success: false, error: 'CUSTOMER_SERVICE_UNAVAILABLE' });
    }
  },
});

export const defaultCustomerController = createCustomerController({
  repo: customerRepository,
  audit: writeAuditLog,
});
