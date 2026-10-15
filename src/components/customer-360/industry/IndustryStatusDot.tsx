import React from 'react';
import { ExpiryStatus } from '../../../domain/industry/dateRules';
import { ServiceStatus } from '../../../domain/industry/vehicleRules';

type Tone = 'red' | 'amber' | 'emerald' | 'slate';

const TONE_CLASSES: Record<Tone, { text: string; dot: string }> = {
  red: { text: 'text-red-600', dot: 'bg-red-500' },
  amber: { text: 'text-amber-600', dot: 'bg-amber-500' },
  emerald: { text: 'text-emerald-600', dot: 'bg-emerald-500' },
  slate: { text: 'text-slate-500', dot: 'bg-slate-400' },
};

interface StatusDisplay {
  tone: Tone;
  label: string;
}

export const EXPIRY_DISPLAY: Record<ExpiryStatus, StatusDisplay> = {
  expired: { tone: 'red', label: 'หมดอายุแล้ว' },
  expiring_soon: { tone: 'amber', label: 'ใกล้หมดอายุ' },
  valid: { tone: 'emerald', label: 'ใช้งานได้' },
  unknown: { tone: 'slate', label: 'ไม่ระบุวันหมดอายุ' },
};

export const SERVICE_DISPLAY: Record<ServiceStatus, StatusDisplay> = {
  overdue: { tone: 'red', label: 'เลยกำหนดเช็คระยะ' },
  due_soon: { tone: 'amber', label: 'ใกล้ถึงกำหนดเช็คระยะ' },
  ok: { tone: 'emerald', label: 'ยังไม่ถึงกำหนด' },
  unknown: { tone: 'slate', label: 'ไม่มีประวัติเข้าบริการ' },
};

/** CB360 status standard: transparent background + dot + coloured text (no pills). */
export const IndustryStatusDot: React.FC<StatusDisplay & { prefix?: string }> = ({
  tone,
  label,
  prefix,
}) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${TONE_CLASSES[tone].text}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${TONE_CLASSES[tone].dot}`} />
    <span>{prefix ? `${prefix}: ${label}` : label}</span>
  </span>
);
