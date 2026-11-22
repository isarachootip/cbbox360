import React from 'react';
import type { ChannelType, ServiceMode, Ticket, TicketPriority, TierType } from '../../types';
import { SERVICE_MODE_OPTIONS } from '../../domain/cases/caseMetrics';

export interface FieldServiceValues {
  serviceMode: ServiceMode;
  assetSerial: string;
  siteLocation: string;
  reporterName: string;
  reporterPhone: string;
}

export interface NewTicketPayload {
  customerId: string;
  customerName: string;
  customerTier: TierType;
  title: string;
  description?: string;
  category: string;
  systemName?: string;
  serviceMode: ServiceMode;
  assetSerial?: string;
  siteLocation?: string;
  reporterName?: string;
  reporterPhone?: string;
  priority: TicketPriority;
  channel: ChannelType;
  status: Ticket['status'];
  slaFormatted: string;
  assignee: string;
  conversationId?: string;
  externalTicketId?: string;
}

export const EMPTY_FIELD_SERVICE: FieldServiceValues = {
  serviceMode: 'Remote',
  assetSerial: '',
  siteLocation: '',
  reporterName: '',
  reporterPhone: '',
};

export const FALLBACK_CASE_CATEGORIES = [
  'แจ้งปัญหา / Error ระบบงาน',
  'ระบบล่ม / ใช้งานไม่ได้',
  'สอบถามการใช้งานระบบ (How-to)',
  'แจ้งซ่อม / ตรวจเช็คอุปกรณ์',
  'ขอปรับแต่ง / เพิ่มฟีเจอร์ (CR)',
];

export const CASE_CHANNEL_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: 'LINE', label: 'LINE' },
  { value: 'Facebook', label: 'Facebook' },
  { value: '3CX', label: '3CX (โทรศัพท์)' },
  { value: 'Email', label: 'Email' },
  { value: 'Web form', label: 'Web form' },
];

interface CaseFieldServiceInputsProps {
  values: FieldServiceValues;
  onChange: (next: FieldServiceValues) => void;
}

export const CaseFieldServiceInputs: React.FC<CaseFieldServiceInputsProps> = ({
  values,
  onChange,
}) => {
  const update = <K extends keyof FieldServiceValues>(key: K, val: FieldServiceValues[K]) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="p-3 rounded-xl bg-bg-subtle border border-border space-y-2.5">
      <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
        ข้อมูลหน้างาน &amp; อุปกรณ์ (Support &amp; Fix)
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1">ประเภทการบริการ</label>
          <select
            value={values.serviceMode}
            onChange={(e) => update('serviceMode', e.target.value as ServiceMode)}
            className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
          >
            {SERVICE_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1">หมายเลขเครื่อง / Serial No.</label>
          <input
            type="text"
            value={values.assetSerial}
            onChange={(e) => update('assetSerial', e.target.value)}
            placeholder="เช่น SN-ZEBRA-8841"
            className="w-full px-2.5 py-1.5 text-xs font-mono border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-secondary font-medium mb-1">สาขา / สถานที่หน้างาน</label>
        <input
          type="text"
          value={values.siteLocation}
          onChange={(e) => update('siteLocation', e.target.value)}
          placeholder="เช่น สนง.ใหญ่ สาทร ชั้น 12 หรือ คลังสินค้าบางพลี"
          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1">ผู้แจ้งหน้างาน</label>
          <input
            type="text"
            value={values.reporterName}
            onChange={(e) => update('reporterName', e.target.value)}
            placeholder="ชื่อผู้ประสานงานหน้างาน"
            className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary font-medium mb-1">เบอร์ติดต่อกลับหน้างาน</label>
          <input
            type="text"
            value={values.reporterPhone}
            onChange={(e) => update('reporterPhone', e.target.value)}
            placeholder="เช่น 081-234-5678"
            className="w-full px-2.5 py-1.5 text-xs font-mono border border-border rounded-lg bg-white focus:outline-none focus:border-brand"
          />
        </div>
      </div>
    </div>
  );
};
