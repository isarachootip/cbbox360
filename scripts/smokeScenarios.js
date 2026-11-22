/**
 * scripts/smokeScenarios.js — Canonical smoke test scenarios for every industry template.
 */
export const DEFAULT_SMOKE_SCENARIOS = {
  hospital: {
    sampleFields: {
      hn: 'HN-88001',
      drug_allergies: ['Penicillin'],
      treatment_right: 'SSO',
      preferred_department: 'อายุรกรรม',
      preferred_doctor: 'นพ. กิตติพงศ์',
    },
    entitledPath: '/api/m/appointment/appointments',
    entitledPayload: {
      contactId: 'SMOKE-1',
      hn: 'HN-88001',
      department: 'อายุรกรรม',
      doctorName: 'นพ. กิตติพงศ์',
      scheduledAt: '2026-12-15T10:00:00Z',
    },
    blockedPath: '/api/m/claim/claims',
  },
  insurance: {
    sampleFields: {
      policy_number: 'POL-88001',
      policy_type: 'HEALTH_OPD_IPD',
      policy_expiry_date: '2027-12-31',
      assigned_agent: 'คุณวรัญญา',
    },
    entitledPath: '/api/m/policy/policies',
    entitledPayload: {
      contactId: 'SMOKE-1',
      policyNumber: 'POL-88001',
      policyType: 'HEALTH_OPD_IPD',
      expiryDate: '2027-12-31',
      sumInsured: 1000000,
    },
    blockedPath: '/api/m/appointment/appointments',
  },
  b2b_wholesale: {
    sampleFields: { credit_term_days: 30 },
    entitledPath: '/api/m/credit-sales/accounts',
    entitledPayload: { contactId: 'SMOKE-1', creditLimit: 200000, creditUsed: 40000 },
    blockedPath: '/api/m/appointment/appointments',
  },
  ecommerce: {
    sampleFields: { marketplace_member_id: 'LAZ-7721' },
    entitledPath: '/api/m/order-tracking/orders',
    entitledPayload: {
      contactId: 'SMOKE-1',
      orderCode: 'ORD-7721',
      trackingNumber: 'FLASH-9981',
      totalAmount: 1250,
    },
    blockedPath: '/api/m/claim/claims',
  },
  support_fix: {
    sampleFields: {
      company_code: 'ST-SMOKE-01',
      system_name: 'ERP Billing',
      ma_status: 'ACTIVE',
      ma_expiry_date: '2027-06-30',
      sla_tier: 'PLATINUM',
    },
    entitledPath: '/api/cases',
    entitledPayload: {
      customerId: 'SMOKE-1',
      customerName: 'บจก. สยามเทค เอ็นเตอร์ไพรส์',
      customerTier: 'PLATINUM',
      title: 'ระบบ ERP ออกใบแจ้งหนี้ขึ้น Error 500',
      category: 'ระบบล่ม / ใช้งานไม่ได้',
      systemName: 'ERP Billing',
      priority: 'Critical',
      channel: 'LINE',
    },
    blockedPath: '/api/m/appointment/appointments',
  },
};
