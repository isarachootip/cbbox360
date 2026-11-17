import { useMemo } from 'react';
import type { Customer, DsrRequest } from '../types';
import { useCustomer } from '../context/CustomerContext';
import { useAuditLog } from '../context/AuditLogContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { computeConsentKpis, resolveCustomerConsent } from '../domain/consent/consentMetrics';
import {
  applyDsrAutomationToCustomer,
  buildCustomerPortabilityCsv,
  buildCustomerPortabilityPayload,
  triggerBrowserDownload,
} from '../domain/consent/dsrExporter';
import { useDsrAndPoliciesStore } from './useDsrAndPoliciesStore';

export type ToggleableConsentKey =
  | 'marketingLine'
  | 'marketingEmail'
  | 'marketingSms'
  | 'marketingPhone'
  | 'profilingAnalytics'
  | 'sensitiveMedical';

const todayStr = () => new Date().toISOString().split('T')[0];

export const useConsentManagement = () => {
  const { customers, updateCustomerConsent } = useCustomer();
  const { logs, logAction, exportAuditLogs } = useAuditLog();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const actorId = currentUser?.username || 'admin';
  const actorRole = currentUser?.role || 'admin';

  const exportSingleCustomerData = (customer: Customer, format: 'json' | 'csv') => {
    if (format === 'json') {
      const payload = buildCustomerPortabilityPayload(customer);
      triggerBrowserDownload(
        `pdpa_portability_${customer.id}.json`,
        JSON.stringify(payload, null, 2),
        'application/json;charset=utf-8;'
      );
    } else {
      const csv = buildCustomerPortabilityCsv([customer]);
      triggerBrowserDownload(`pdpa_portability_${customer.id}.csv`, csv, 'text/csv;charset=utf-8;');
    }
    void logAction({
      userId: actorId,
      userRole: actorRole,
      action: `ส่งออกสำเนาข้อมูลส่วนบุคคล (Data Portability ${format.toUpperCase()})`,
      category: 'access',
      resource: `Customer/${customer.id} (${customer.name})`,
      details: 'PDPA Section 30–31 Subject Access Export',
    });
    showToast(`ดาวน์โหลดไฟล์สำเนาข้อมูลของ "${customer.name}" เรียบร้อยแล้ว`, 'success');
  };

  const handleExecuteCompletedDsr = (dsr: DsrRequest) => {
    const targetCustomer = customers.find((c) => c.id === dsr.customerId);
    if (!targetCustomer) return;
    if (dsr.requestType === 'ACCESS_EXPORT') {
      exportSingleCustomerData(targetCustomer, 'json');
      return;
    }
    if (dsr.requestType === 'WITHDRAW_CONSENT' || dsr.requestType === 'ERASURE_ANONYMIZE') {
      const patch = applyDsrAutomationToCustomer(targetCustomer, dsr.requestType, todayStr());
      if (patch.consent) {
        updateCustomerConsent(targetCustomer.id, patch.consent, {
          email: patch.email,
          ...(patch.nickname === undefined && dsr.requestType === 'ERASURE_ANONYMIZE'
            ? { nickname: undefined }
            : {}),
        });
      }
    }
  };

  const store = useDsrAndPoliciesStore({
    currentUserId: currentUser?.id,
    actorId,
    onAudit: (action, category, resource, details) => {
      void logAction({ userId: actorId, userRole: actorRole, action, category, resource, details });
    },
    onToast: (msg) => showToast(msg, 'success'),
    onExecuteCompletedDsr: handleExecuteCompletedDsr,
  });

  const kpis = useMemo(
    () => computeConsentKpis(customers, store.dsrRequests),
    [customers, store.dsrRequests]
  );

  const toggleCustomerConsentField = (
    customer: Customer,
    key: ToggleableConsentKey,
    label: string
  ) => {
    const resolved = resolveCustomerConsent(customer);
    const nextValue = !resolved[key];
    const policyVer = store.activePolicy?.version || 'v2.1';
    updateCustomerConsent(customer.id, {
      ...resolved,
      [key]: nextValue,
      policyVersion: policyVer,
      consentSource: 'Admin',
      updatedAt: todayStr(),
    });
    void logAction({
      userId: actorId,
      userRole: actorRole,
      action: `${nextValue ? 'เปิดความยินยอม' : 'ถอนความยินยอม'} PDPA (${label})`,
      category: 'data',
      resource: `Customer/${customer.id} (${customer.name})`,
      details: `Policy ${policyVer} · ${key}=${String(nextValue)}`,
    });
    showToast(
      `อัปเดต Consent "${label}" ของ ${customer.name} เป็น "${nextValue ? 'ยินยอม' : 'ถอนความยินยอม'}" แล้ว`,
      'success'
    );
  };

  const exportFilteredConsentCsv = (targetCustomers: readonly Customer[]) => {
    const csv = buildCustomerPortabilityCsv(targetCustomers);
    triggerBrowserDownload(`cb360_consent_registry_${todayStr()}.csv`, csv, 'text/csv;charset=utf-8;');
    void logAction({
      userId: actorId,
      userRole: actorRole,
      action: `Export ทะเบียนสถานะความยินยอมลูกค้า (${targetCustomers.length} ราย)`,
      category: 'access',
      resource: 'Consent/Registry-CSV',
    });
    showToast(`ส่งออกทะเบียนความยินยอม ${targetCustomers.length} รายการเรียบร้อยแล้ว`, 'success');
  };

  return {
    customers,
    dsrRequests: store.dsrRequests,
    policies: store.policies,
    activePolicy: store.activePolicy,
    kpis,
    logs,
    exportAuditLogs,
    toggleCustomerConsentField,
    exportSingleCustomerData,
    exportFilteredConsentCsv,
    createDsrRequest: store.createDsrRequest,
    advanceDsrStatus: store.advanceDsrStatus,
    publishPolicyVersion: store.publishPolicyVersion,
  };
};
