import React from 'react';
import { Lock } from 'lucide-react';
import type { CreditLimitRequest } from '../../types';
import { GradeBadge } from '../common/GradeBadge';

interface CreditRightSidebarProps {
  creditRequests: CreditLimitRequest[];
  onOpenCustomer: (customerId: string) => void;
  onApprove: (reqId: string, customerName: string) => void;
  onReject: (reqId: string, customerName: string) => void;
}

export const CreditRightSidebar: React.FC<CreditRightSidebarProps> = ({
  creditRequests,
  onOpenCustomer,
  onApprove,
  onReject,
}) => {
  const pendingRequests = creditRequests.filter((r) => r.status === 'pending');

  return (
    <div className="w-[340px] flex-shrink-0 bg-white border-l border-border h-full p-4 space-y-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">คำขอเพิ่มวงเงิน</span>
            <span className="text-xs font-mono font-semibold text-text-secondary">
              {pendingRequests.length} รออนุมัติ
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-bg-subtle rounded-card border border-border space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    onClick={() => onOpenCustomer(req.customerId)}
                    className="font-bold text-xs text-text-primary hover:text-brand cursor-pointer"
                  >
                    {req.customerName}
                  </span>
                  <GradeBadge grade={req.grade} size="sm" prefix="" />
                </div>

                <div className="text-xs font-mono">
                  <span className="text-text-secondary line-through">
                    ฿{req.currentLimit.toLocaleString()}
                  </span>
                  <span className="text-brand font-bold mx-1.5">→</span>
                  <span className="font-bold text-emerald-700">
                    ฿{req.requestedLimit.toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary leading-tight">
                  {req.sourceNote}
                </div>

                <div className="text-[11px] text-text-secondary">
                  ชำระตรงเวลา{' '}
                  <strong className="text-emerald-700 font-mono">{req.onTimePaymentRate}%</strong> ·
                  Tier <strong className="font-mono">{req.tier}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onApprove(req.id, req.customerName)}
                    className="py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    อนุมัติ
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(req.id, req.customerName)}
                    className="py-1.5 border border-border hover:bg-white text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    ไม่อนุมัติ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 bg-bg-subtle rounded-card border border-border space-y-2.5">
          <div className="text-xs font-bold text-text-primary">ติดตามชำระวันนี้</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">แจ้งเตือนก่อนครบกำหนด (LINE)</span>
              <span className="font-mono font-bold text-text-primary">37 ราย</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Collection call list (3CX)</span>
              <span className="font-mono font-bold text-text-primary">21 ราย</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">ส่งต่อทีมการเงิน (90+ วัน)</span>
              <span className="font-mono font-bold text-rose-600">6 ราย</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-600 flex items-start gap-1.5">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
        <span>
          Agent ทั่วไปเห็นเฉพาะสีสถานะเครดิต · ตัวเลขเห็นเฉพาะสิทธิ์ <code>credit.read</code>
        </span>
      </div>
    </div>
  );
};
