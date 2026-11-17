import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ConsentPolicyTemplate,
  ConsentSource,
  Customer,
  DsrRequest,
  DsrRequestType,
  DsrStatus,
} from '../types';
import { isServerAuth } from '../config/authMode';
import { consentApi } from '../services/consentApi';
import { DSR_REQUEST_TYPE_META, mockConsentPolicies, mockDsrRequests } from '../data/consent';
import {
  loadStoredConsentPolicies,
  loadStoredDsrRequests,
  saveStoredConsentPolicies,
  saveStoredDsrRequests,
} from '../domain/consent/consentStorage';

const getBrowserStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);
const todayStr = () => new Date().toISOString().split('T')[0];

interface UseDsrAndPoliciesStoreParams {
  currentUserId?: string;
  actorId: string;
  onAudit: (action: string, category: 'data' | 'system', resource: string, details?: string) => void;
  onToast: (message: string) => void;
  onExecuteCompletedDsr: (dsr: DsrRequest) => void;
}

export const useDsrAndPoliciesStore = ({
  currentUserId,
  actorId,
  onAudit,
  onToast,
  onExecuteCompletedDsr,
}: UseDsrAndPoliciesStoreParams) => {
  const [dsrRequests, setDsrRequests] = useState<DsrRequest[]>(() =>
    loadStoredDsrRequests(getBrowserStorage(), mockDsrRequests)
  );
  const [policies, setPolicies] = useState<ConsentPolicyTemplate[]>(() =>
    loadStoredConsentPolicies(getBrowserStorage(), mockConsentPolicies)
  );

  const dsrRef = useRef(dsrRequests);
  dsrRef.current = dsrRequests;
  const policiesRef = useRef(policies);
  policiesRef.current = policies;

  useEffect(() => {
    if (!isServerAuth || !currentUserId) return;
    let cancelled = false;
    consentApi.getOverview().then((res) => {
      if (cancelled || res.status !== 'ok') return;
      if (res.dsrRequests.length > 0) {
        saveStoredDsrRequests(getBrowserStorage(), res.dsrRequests);
        setDsrRequests(res.dsrRequests);
      }
      if (res.policies.length > 0) {
        saveStoredConsentPolicies(getBrowserStorage(), res.policies);
        setPolicies(res.policies);
      }
    });
    return () => { cancelled = true; };
  }, [currentUserId]);

  const activePolicy = useMemo(
    () => policies.find((p) => p.isActive) || policies[0],
    [policies]
  );

  const createDsrRequest = (input: {
    customer: Customer;
    requestType: DsrRequestType;
    channel: ConsentSource;
    reason: string;
    assignee: string;
  }) => {
    const maxDsrNum = dsrRef.current.reduce((max, item) => {
      const m = /^DSR-(\d+)$/i.exec(item.id);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 2600);
    const created: DsrRequest = {
      id: `DSR-${maxDsrNum + 1}`,
      customerId: input.customer.id,
      customerName: input.customer.name,
      requestType: input.requestType,
      channel: input.channel,
      reason: input.reason.trim(),
      status: 'Open',
      slaDaysLeft: 30,
      assignee: input.assignee.trim() || 'สมศักดิ์ บ. (DPO)',
      createdAt: todayStr(),
    };
    const nextList = [created, ...dsrRef.current];
    saveStoredDsrRequests(getBrowserStorage(), nextList);
    setDsrRequests(nextList);
    if (isServerAuth) void consentApi.saveDsr(created);
    onAudit(
      `เปิดรับคำขอใช้สิทธิ์ PDPA ใหม่ (${DSR_REQUEST_TYPE_META[input.requestType].shortLabel})`,
      'data',
      `${created.id} · ${input.customer.name}`,
      input.reason.trim()
    );
    onToast(`สร้างคำขอใช้สิทธิ์ ${created.id} (SLA 30 วัน) เรียบร้อยแล้ว`);
  };

  const advanceDsrStatus = (dsr: DsrRequest, nextStatus: DsrStatus) => {
    if (nextStatus === 'Completed') onExecuteCompletedDsr(dsr);
    const updated: DsrRequest = {
      ...dsr,
      status: nextStatus,
      resolvedAt: nextStatus === 'Completed' ? todayStr() : dsr.resolvedAt,
      resolutionNote:
        nextStatus === 'Completed'
          ? `ดำเนินการตามสิทธิ์ ${DSR_REQUEST_TYPE_META[dsr.requestType].shortLabel} โดย ${actorId}`
          : dsr.resolutionNote,
    };
    const nextList = dsrRef.current.map((item) => (item.id === dsr.id ? updated : item));
    saveStoredDsrRequests(getBrowserStorage(), nextList);
    setDsrRequests(nextList);
    if (isServerAuth) void consentApi.saveDsr(updated);
    onAudit(
      `อัปเดตสถานะคำขอ ${dsr.id} เป็น ${nextStatus}`,
      'data',
      `${dsr.id} (${dsr.customerName})`,
      DSR_REQUEST_TYPE_META[dsr.requestType].label
    );
    onToast(`อัปเดตคำขอ ${dsr.id} เป็นสถานะ "${nextStatus}" เรียบร้อยแล้ว`);
  };

  const publishPolicyVersion = (input: {
    version: string;
    title: string;
    effectiveDate: string;
    summary: string;
    lineConsentMessage: string;
  }) => {
    const newPol: ConsentPolicyTemplate = {
      id: `pol-${input.version.trim().replace(/\s+/g, '-')}-${Date.now().toString().slice(-3)}`,
      version: input.version.trim(),
      title: input.title.trim(),
      effectiveDate: input.effectiveDate,
      summary: input.summary.trim(),
      lineConsentMessage: input.lineConsentMessage.trim(),
      isActive: true,
    };
    const nextPolicies = [newPol, ...policiesRef.current.map((p) => ({ ...p, isActive: false }))];
    saveStoredConsentPolicies(getBrowserStorage(), nextPolicies);
    setPolicies(nextPolicies);
    if (isServerAuth) void consentApi.savePolicy(newPol);
    onAudit(
      `ประกาศใช้นโยบายความเป็นส่วนตัว PDPA เวอร์ชันใหม่ (${newPol.version})`,
      'system',
      `ConsentPolicy/${newPol.version}`,
      newPol.title
    );
    onToast(`ประกาศใช้นโยบาย PDPA เวอร์ชัน ${newPol.version} เรียบร้อยแล้ว`);
  };

  return {
    dsrRequests,
    policies,
    activePolicy,
    createDsrRequest,
    advanceDsrStatus,
    publishPolicyVersion,
  };
};
