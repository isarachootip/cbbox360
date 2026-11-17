import React from 'react';
import { Copy, Plus, Download, ShieldCheck } from 'lucide-react';
import type { AuditLogEntry, ConsentPolicyTemplate } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';

interface PolicyAndAuditTabProps {
  policies: ConsentPolicyTemplate[];
  logs: AuditLogEntry[];
  onOpenNewPolicyModal: () => void;
  onExportAuditLogs: (entries: AuditLogEntry[]) => void;
}

export const PolicyAndAuditTab: React.FC<PolicyAndAuditTabProps> = ({
  policies,
  logs,
  onOpenNewPolicyModal,
  onExportAuditLogs,
}) => {
  const { showToast } = useToast();

  const pdpaLogs = logs.filter(
    (entry) =>
      /PDPA|Consent|DSR|PII|Portability|ส่วนบุคคล/i.test(entry.action) ||
      /Consent|DSR|Customer/i.test(entry.resource || '')
  );

  const handleCopyLineMessage = async (pol: ConsentPolicyTemplate) => {
    try {
      await navigator.clipboard.writeText(pol.lineConsentMessage);
      showToast(
        `คัดลอกข้อความและลิงก์ขอความยินยอม (${pol.version}) สำหรับวางส่งในแชท LINE เรียบร้อยแล้ว`,
        'success'
      );
    } catch {
      showToast('คัดลอกข้อความสำเร็จ', 'success');
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              เวอร์ชันประกาศความเป็นส่วนตัว (Privacy Notice & LINE Consent Link)
            </h3>
            <p className="text-xs text-text-secondary">
              จัดการข้อความแจ้งวัตถุประสงค์และคัดลอกลิงก์ส่งให้ลูกค้ากดยืนยันผ่าน Omnichannel Inbox
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewPolicyModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-card transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ประกาศนโยบายเวอร์ชันใหม่</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {policies.map((pol) => (
            <div
              key={pol.id}
              className={`bg-white rounded-card border p-4 shadow-card space-y-3 ${
                pol.isActive ? 'border-brand/60' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-brand">{pol.version}</span>
                    <StatusBadge
                      status={pol.isActive ? 'Active' : 'Inactive'}
                      label={pol.isActive ? 'บังคับใช้ปัจจุบัน' : 'ฉบับย้อนหลัง'}
                    />
                  </div>
                  <h4 className="font-semibold text-sm text-text-primary mt-1">{pol.title}</h4>
                  <div className="text-xs text-text-muted font-mono mt-0.5">
                    มีผลบังคับใช้: {pol.effectiveDate}
                  </div>
                </div>
                <ShieldCheck
                  className={`w-5 h-5 shrink-0 ${
                    pol.isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">{pol.summary}</p>

              <div className="p-3 rounded-lg bg-bg-subtle border border-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    ข้อความพร้อมส่งในแชท LINE / Facebook:
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyLineMessage(pol)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกไปส่งแชท</span>
                  </button>
                </div>
                <p className="text-xs text-text-primary break-words font-mono">
                  {pol.lineConsentMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              ประวัติการเปลี่ยนแปลงความยินยอมและการเข้าถึงข้อมูล (PDPA Audit Trail)
            </h3>
            <p className="text-xs text-text-secondary">
              บันทึกหลักฐานการให้/ถอนความยินยอม การส่งออกสำเนาข้อมูล และการเข้าถึงข้อมูลส่วนบุคคล
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExportAuditLogs(pdpaLogs)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand" />
            <span>Export Audit CSV ({pdpaLogs.length})</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-muted text-text-secondary font-medium">
                <th className="py-2.5 px-4 font-medium">วัน-เวลา</th>
                <th className="py-2.5 px-4 font-medium">ผู้ดำเนินการ</th>
                <th className="py-2.5 px-4 font-medium">กิจกรรม PDPA</th>
                <th className="py-2.5 px-4 font-medium">ข้อมูลอ้างอิง</th>
                <th className="py-2.5 px-4 font-medium">รายละเอียดหลักฐาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pdpaLogs.slice(0, 20).map((entry) => (
                <tr key={entry.id} className="hover:bg-bg-subtle/60">
                  <td className="py-2.5 px-4 font-mono text-text-muted whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-text-primary">
                    {entry.userId}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-text-primary">{entry.action}</td>
                  <td className="py-2.5 px-4 font-mono text-brand">{entry.resource || '-'}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{entry.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
