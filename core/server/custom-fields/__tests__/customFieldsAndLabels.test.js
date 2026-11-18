import { describe, it, expect, vi } from 'vitest';
import { createInMemoryCustomFieldService } from '../customFieldService.js';
import { redactCustomFields, verifyCustomFieldWriteAccess } from '../fieldRedactor.js';
import { createInMemoryLabelService } from '../../labels/labelService.js';
import { extractCustomFieldTemplateVariables } from '../../../shared/dynamicFieldSchema.js';

const SAMPLE_DEFS = [
  {
    id: 'fd-hn',
    entityType: 'contact',
    key: 'hn',
    label: 'รหัสผู้ป่วย (HN)',
    type: 'text',
    isIndexed: true,
    validation: {
      required: true,
      unique: true,
      regex: '^[A-Za-z0-9-]{3,20}$',
      regexError: 'รูปแบบ HN ไม่ถูกต้อง',
    },
    ui: { group: 'เวชระเบียน', order: 1, variableKey: 'hn_number' },
  },
  {
    id: 'fd-allergy',
    entityType: 'contact',
    key: 'drug_allergies',
    label: 'ประวัติแพ้ยา',
    type: 'tags',
    sensitivity: 'pdpa_s26',
    acl: {
      viewPerm: 'contact.pdpa_s26:read',
      editPerm: 'contact.allergy:write',
      redactMode: 'flag_only',
    },
    ui: {
      group: 'ความปลอดภัย',
      order: 2,
      alertBanner: {
        whenNonEmpty: true,
        severity: 'danger',
        prefix: 'แพ้ยา:',
        redactedMessage: 'มีประวัติแพ้ยา (ติดต่อแพทย์/พยาบาล)',
      },
    },
  },
  {
    id: 'fd-right',
    entityType: 'contact',
    key: 'treatment_right',
    label: 'สิทธิการรักษา',
    type: 'select',
    isIndexed: true,
    options: [
      { value: 'OPD_IPD', label: 'ประกันสุขภาพ OPD/IPD' },
      { value: 'SSO', label: 'ประกันสังคม' },
    ],
  },
  {
    id: 'fd-expiry',
    entityType: 'contact',
    key: 'policy_expiry',
    label: 'วันหมดอายุความคุ้มครอง',
    type: 'date',
    isIndexed: true,
  },
];

describe('Dynamic Custom Fields, Index, Declarative PDPA ACL & Labels (Phase 2 - PR-04)', () => {
  it('validates custom fields dynamically, enforces per-tenant uniqueness, and indexes dates/text', async () => {
    const cf = createInMemoryCustomFieldService();
    await cf.applyTemplateFieldDefs('tnt_hosp_1', SAMPLE_DEFS);
    await cf.applyTemplateFieldDefs('tnt_hosp_2', SAMPLE_DEFS);

    // Invalid HN regex rejected
    const badRes = await cf.validateAndSaveEntityFields({
      tenantId: 'tnt_hosp_1',
      entityType: 'contact',
      entityId: 'C001',
      values: { hn: '@@bad@@', drug_allergies: [] },
    });
    expect(badRes.ok).toBe(false);
    expect(badRes.errors[0].path).toBe('hn');

    // Valid save on tnt_hosp_1
    const ok1 = await cf.validateAndSaveEntityFields({
      tenantId: 'tnt_hosp_1',
      entityType: 'contact',
      entityId: 'C001',
      values: {
        hn: 'HN-69001',
        drug_allergies: ['Penicillin'],
        treatment_right: 'OPD_IPD',
        policy_expiry: '2026-12-15',
      },
    });
    expect(ok1.ok).toBe(true);

    // Duplicate HN inside SAME tenant rejected
    const dupSameTenant = await cf.validateAndSaveEntityFields({
      tenantId: 'tnt_hosp_1',
      entityType: 'contact',
      entityId: 'C002',
      values: { hn: 'HN-69001', drug_allergies: [] },
    });
    expect(dupSameTenant.ok).toBe(false);
    expect(dupSameTenant.code).toBe('DUPLICATE_CUSTOM_FIELD');

    // Same HN in a DIFFERENT tenant is completely isolated and allowed!
    const okOtherTenant = await cf.validateAndSaveEntityFields({
      tenantId: 'tnt_hosp_2',
      entityType: 'contact',
      entityId: 'C009',
      values: { hn: 'HN-69001', drug_allergies: [] },
    });
    expect(okOtherTenant.ok).toBe(true);

    // Search by indexed date range within tnt_hosp_1
    const expiringIds = await cf.searchEntitiesByDateRange({
      tenantId: 'tnt_hosp_1',
      entityType: 'contact',
      fieldKey: 'policy_expiry',
      fromDate: '2026-12-01',
      toDate: '2026-12-31',
    });
    expect(expiringIds).toEqual(['C001']);
  });

  it('redacts pdpa_s26 fields declaratively, logs sensitive views, and enforces field edit permissions', async () => {
    const auditSpy = vi.fn();
    const stored = {
      hn: 'HN-69001',
      drug_allergies: ['Penicillin', 'Aspirin'],
      treatment_right: 'SSO',
    };

    // Agent without pdpa_s26:read gets flag_only redaction + redacted banner
    const agentView = await redactCustomFields({
      defs: SAMPLE_DEFS,
      values: stored,
      grantedPermissions: ['contact:read'],
      onSensitiveAccess: auditSpy,
    });
    expect(agentView.values.hn).toBe('HN-69001');
    expect(agentView.values.drug_allergies).toBeUndefined();
    expect(agentView.redactedFlags.drug_allergies).toEqual({ redacted: true, hasValue: true });
    expect(agentView.banners[0].text).toBe('มีประวัติแพ้ยา (ติดต่อแพทย์/พยาบาล)');
    expect(auditSpy).not.toHaveBeenCalled();

    // Doctor with contact.pdpa_s26:read sees full values and triggers audit log
    const doctorView = await redactCustomFields({
      defs: SAMPLE_DEFS,
      values: stored,
      grantedPermissions: ['contact:read', 'contact.pdpa_s26:read'],
      onSensitiveAccess: auditSpy,
    });
    expect(doctorView.values.drug_allergies).toEqual(['Penicillin', 'Aspirin']);
    expect(doctorView.banners[0].text).toBe('Penicillin, Aspirin');
    expect(auditSpy).toHaveBeenCalledWith(['drug_allergies']);

    // Write check: user without contact.allergy:write cannot modify drug_allergies
    const deniedWrite = verifyCustomFieldWriteAccess({
      defs: SAMPLE_DEFS,
      beforeValues: stored,
      afterValues: { ...stored, drug_allergies: ['Ibuprofen'] },
      grantedPermissions: ['contact:read', 'contact:write'],
    });
    expect(deniedWrite.ok).toBe(false);
    expect(deniedWrite.forbiddenFields).toEqual(['drug_allergies']);

    // Nurse WITH contact.allergy:write CAN modify drug_allergies
    const nurseWrite = verifyCustomFieldWriteAccess({
      defs: SAMPLE_DEFS,
      beforeValues: stored,
      afterValues: { ...stored, drug_allergies: ['Penicillin', 'Ibuprofen'] },
      grantedPermissions: ['contact:read', 'contact.allergy:write'],
    });
    expect(nurseWrite.ok).toBe(true);
  });

  it('extracts template variables from custom fields and resolves per-tenant labels non-destructively', async () => {
    const vars = extractCustomFieldTemplateVariables(SAMPLE_DEFS, { hn: 'HN-69001' });
    expect(vars).toEqual({ hn_number: 'HN-69001' });

    const labels = createInMemoryLabelService();
    await labels.applyTemplateLabels('tnt_hosp', 'th', { 'contact.singular': 'ผู้ป่วย' });
    await labels.applyTemplateLabels('tnt_ins', 'th', { 'contact.singular': 'ผู้เอาประกัน' });

    expect(await labels.t('tnt_hosp', 'contact.singular', 'ลูกค้า')).toBe('ผู้ป่วย');
    expect(await labels.t('tnt_ins', 'contact.singular', 'ลูกค้า')).toBe('ผู้เอาประกัน');
    expect(await labels.t('default', 'contact.singular', 'ลูกค้า')).toBe('ลูกค้า');

    // Customize label on tnt_hosp -> template re-apply must NOT overwrite
    await labels.setTenantLabel('tnt_hosp', 'th', 'contact.singular', 'ผู้รับบริการ');
    await labels.applyTemplateLabels('tnt_hosp', 'th', {
      'contact.singular': 'ผู้ป่วย',
      'case.singular': 'เคสพยาบาล',
    });

    expect(await labels.t('tnt_hosp', 'contact.singular', 'ลูกค้า')).toBe('ผู้รับบริการ');
    expect(await labels.t('tnt_hosp', 'case.singular', 'Ticket')).toBe('เคสพยาบาล');
  });
});
