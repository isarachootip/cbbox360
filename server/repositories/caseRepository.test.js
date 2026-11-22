import { describe, it, expect } from 'vitest';
import { createInMemoryCaseRepository } from './caseRepository.js';
import { createCaseController } from '../controllers/caseController.js';
import { runWithTenantContext } from '../../core/server/tenancy/tenantContext.js';

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

describe('Tenant-isolated Service Case Repository & Controller', () => {
  it('strictly isolates cases across tenants and supports filtering + external ref updates', async () => {
    const repo = createInMemoryCaseRepository();
    const ctrl = createCaseController({ caseRepo: repo });

    // Tenant A creates a Support & Fix case
    const resA = mockRes();
    await runWithTenantContext({ tenantId: 'tnt_support_a' }, async () => {
      await ctrl.createCase(
        {
          user: { displayName: 'นพดล (L1)' },
          body: {
            customerId: 'SF001',
            customerName: 'บจก. สยามเทค เอ็นเตอร์ไพรส์',
            customerTier: 'PLATINUM',
            title: 'ระบบ ERP ออกใบแจ้งหนี้ไม่ได้ ขึ้น Error 500',
            category: 'ระบบล่ม / ใช้งานไม่ได้',
            systemName: 'ERP Billing',
            serviceMode: 'On-site',
            assetSerial: 'SRV-BKK-09',
            siteLocation: 'สนง.ใหญ่ สาทร',
            reporterName: 'คุณธนกฤต',
            reporterPhone: '081-222-3344',
            priority: 'Critical',
            channel: 'LINE',
            externalTicketId: 'HD-90412',
          },
        },
        resA
      );
    });
    expect(resA.statusCode).toBe(201);
    const createdId = resA.body.case.id;
    expect(resA.body.case.externalTicketId).toBe('HD-90412');
    expect(resA.body.case.serviceMode).toBe('On-site');
    expect(resA.body.case.assetSerial).toBe('SRV-BKK-09');
    expect(resA.body.case.slaFormatted).toBe('2 ชม.');

    // Tenant B must see ZERO cases from Tenant A
    const listB = mockRes();
    await runWithTenantContext({ tenantId: 'tnt_hospital_b' }, async () => {
      await ctrl.listCases({ query: {} }, listB);
    });
    expect(listB.statusCode).toBe(200);
    expect(listB.body.cases).toHaveLength(0);

    // Tenant A transitions status -> In Progress and appends log note
    const patchRes = mockRes();
    await runWithTenantContext({ tenantId: 'tnt_support_a' }, async () => {
      await ctrl.updateCase(
        {
          user: { displayName: 'วิศวกร L2' },
          params: { id: createdId },
          body: {
            status: 'In Progress',
            assignee: 'กฤษณะ (L2)',
            rootCause: 'DB connection pool เต็ม',
            resolutionSummary: 'เพิ่ม pool size และรีสตาร์ท worker',
            externalTicketId: 'HD-90412-REV',
          },
        },
        patchRes
      );
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.case.status).toBe('In Progress');
    expect(patchRes.body.case.assignee).toBe('กฤษณะ (L2)');
    expect(patchRes.body.case.rootCause).toBe('DB connection pool เต็ม');
    expect(patchRes.body.case.resolutionSummary).toBe('เพิ่ม pool size และรีสตาร์ท worker');
    expect(patchRes.body.case.externalTicketId).toBe('HD-90412-REV');
    expect(patchRes.body.case.activityLogs.length).toBeGreaterThanOrEqual(4);

    const logRes = mockRes();
    await runWithTenantContext({ tenantId: 'tnt_support_a' }, async () => {
      await ctrl.addCaseLog(
        {
          user: { displayName: 'วิศวกร L2' },
          params: { id: createdId },
          body: { text: 'รีสตาร์ท Billing Worker แล้ว อยู่ระหว่างทดสอบหน้างาน' },
        },
        logRes
      );
    });
    expect(logRes.statusCode).toBe(200);
    expect(logRes.body.case.activityLogs.at(-1).text).toContain('Billing Worker');
  });

  it('rejects malformed case payload with 400', async () => {
    const repo = createInMemoryCaseRepository();
    const ctrl = createCaseController({ caseRepo: repo });
    const res = mockRes();
    await runWithTenantContext({ tenantId: 'tnt_support_a' }, async () => {
      await ctrl.createCase({ body: { title: 'x' } }, res);
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('INVALID_CASE_PAYLOAD');
  });
});
