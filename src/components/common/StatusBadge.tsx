import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  dotSize?: string;
  textSize?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  dotSize = 'w-1.5 h-1.5',
  textSize = 'text-xs',
}) => {
  const getStatusConfig = (st: string) => {
    const s = (st || '').toLowerCase().trim();
    switch (s) {
      case 'open':
      case 'in_progress':
      case 'in progress':
      case 'กำลังดำเนินการ':
        return { dot: 'bg-blue-500', text: 'text-blue-600' };
      case 'pending':
      case 'awaiting':
      case 'รอตอบกลับ':
      case 'รอดำเนินการ':
        return { dot: 'bg-amber-500', text: 'text-amber-600' };
      case 'waiting':
      case 'in_review':
      case 'รออนุมัติ':
      case 'รอตรวจสอบ':
        return { dot: 'bg-purple-500', text: 'text-purple-600' };
      case 'closed':
      case 'resolved':
      case 'completed':
      case 'active':
      case 'connected':
      case 'success':
      case 'อนุมัติแล้ว':
      case 'เชื่อมต่อแล้ว':
      case 'ใช้งาน':
        return { dot: 'bg-emerald-500', text: 'text-emerald-600' };
      case 'inactive':
      case 'disconnected':
      case 'draft':
      case 'closed_lost':
      case 'closed lost':
      case 'ปิดการขาย (ไม่ได้)':
      case 'ยกเลิก':
      case 'ไม่ใช้งาน':
        return { dot: 'bg-slate-400', text: 'text-slate-500' };
      case 'danger':
      case 'overdue':
      case 'over_sla':
      case 'rejected':
      case 'เกิน sla':
      case 'ปฏิเสธ':
        return { dot: 'bg-rose-500', text: 'text-rose-600' };
      default:
        return { dot: 'bg-slate-400', text: 'text-slate-600' };
    }
  };

  const config = getStatusConfig(status);
  const displayText = label || status;

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${config.text} ${textSize} ${className}`}>
      <span className={`rounded-full shrink-0 ${config.dot} ${dotSize}`} />
      <span>{displayText}</span>
    </span>
  );
};
