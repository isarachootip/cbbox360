import { describe, it, expect, vi } from 'vitest';
import { createCustomerController } from './customerController.js';

const makeValidCustomer = (overrides = {}) => ({
  id: 'C00138',
  name: 'คุณวรพล ดีงาม',
  prefix: 'คุณ',
  firstName: 'วรพล',
  lastName: 'ดีงาม',
  customerType: 'INDIVIDUAL',
  contacts: [],
  addresses: [],
  initials: 'วด',
  tier: 'GOLD',
  creditGrade: 'A',
  segments: ['New Member'],
  lifetimeValue: 0,
  spend12Months: 0,
  orders12Months: 0,
  lastOrderDaysAgo: 0,
  lastOrderCode: '-',
  lastOrderAmount: 0,
  tierValidUntil: '31 ธ.ค. 2026',
  tierProgressPercent: 0,
  tierTargetSpend: 50000,
  phone: '089-111-2233',
  fullPhone: '089-111-2233',
  email: 'worapol@example.com',
  channels: { line: true, facebook: false, email: true, sms: false },
  birthday: '-',
  customerSince: 'เมื่อสักครู่',
  consent: { marketingLine: true, marketingEmail: true, marketingSms: false },
  creditLimit: 100000,
  creditUsed: 0,
  creditOverdue: 0,
  churnRisk: 'ต่ำ',
  nextBestAction: {
    description: 'ต้อนรับลูกค้าใหม่',
    actionLabel: 'ส่งข้อความต้อนรับ',
  },
  ...overrides,
});

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('customerController — PostgreSQL CDP Persistence', () => {
  it('rejects invalid customer payload on POST with 400 INVALID_CUSTOMER_PAYLOAD', async () => {
    const repo = { listAll: vi.fn(), upsert: vi.fn() };
    const audit = vi.fn();
    const ctrl = createCustomerController({ repo, audit });
    const res = makeRes();

    await ctrl.createCustomer({ body: { customer: { id: '' } }, user: { id: 'usr-1', role: 'admin' }, ip: '127.0.0.1' }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'INVALID_CUSTOMER_PAYLOAD' }));
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('persists valid customer on POST, writes audit log, and returns 201', async () => {
    const stored = [];
    const repo = {
      listAll: vi.fn(async () => stored),
      upsert: vi.fn(async (c) => {
        stored.unshift(c);
        return c;
      }),
    };
    const audit = vi.fn(async () => {});
    const ctrl = createCustomerController({ repo, audit });

    const customer = makeValidCustomer();
    const resCreate = makeRes();
    await ctrl.createCustomer(
      { body: { customer }, user: { id: 'usr-admin', role: 'admin' }, ip: '127.0.0.1' },
      resCreate
    );

    expect(resCreate.status).toHaveBeenCalledWith(201);
    expect(resCreate.json).toHaveBeenCalledWith({ success: true, customer });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE_CUSTOMER', resource: 'Customer/C00138' })
    );

    const resList = makeRes();
    await ctrl.listCustomers({}, resList);
    expect(resList.status).toHaveBeenCalledWith(200);
    expect(resList.json).toHaveBeenCalledWith({ success: true, customers: [customer] });
  });

  it('updates customer on PUT and rejects ID mismatch', async () => {
    const repo = { listAll: vi.fn(), upsert: vi.fn(async (c) => c) };
    const audit = vi.fn(async () => {});
    const ctrl = createCustomerController({ repo, audit });

    const customer = makeValidCustomer({ id: 'C00138', email: 'updated@example.com' });
    const resMismatch = makeRes();
    await ctrl.updateCustomer(
      { params: { customerId: 'C99999' }, body: { customer }, user: { id: 'usr-1', role: 'admin' } },
      resMismatch
    );
    expect(resMismatch.status).toHaveBeenCalledWith(400);

    const resOk = makeRes();
    await ctrl.updateCustomer(
      { params: { customerId: 'C00138' }, body: { customer }, user: { id: 'usr-1', role: 'admin' } },
      resOk
    );
    expect(resOk.status).toHaveBeenCalledWith(200);
    expect(resOk.json).toHaveBeenCalledWith({ success: true, customer });
  });
});
