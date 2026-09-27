import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  PhoneCall,
  Send,
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign,
  Lock,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { GradeBadge } from '../components/common/GradeBadge';
import { TierBadge } from '../components/common/TierBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { mockCreditAccounts } from '../data/credit';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';

export const CreditSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    creditRequests,
    approveCreditLimit,
    rejectCreditLimit,
    setSelectedCustomerId,
  } = useCustomer();

  const [isCallListModalOpen, setIsCallListModalOpen] = useState(false);

  const handleOpenCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    navigate(`/customers/${custId}`);
  };

  const handleApprove = (reqId: string, name: string) => {
    approveCreditLimit(reqId);
    showToast(`อนุมัติคำขอเพิ่มวงเงินของ "${name}" สำเร็จ`, 'success');
  };

  const handleReject = (reqId: string, name: string) => {
    rejectCreditLimit(reqId);
    showToast(`ปฏิเสธคำขอเพิ่มวงเงินของ "${name}"`, 'warning');
  };

  const handleCreateCallList = () => {
    showToast('สร้าง Collection Call List 21 รายการในระบบ 3CX เรียบร้อยแล้ว', 'success');
    setIsCallListModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Credit Sales"
        actionButton={
          <button
            onClick={() => setIsCallListModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>สร้าง Collection call list</span>
          </button>
        }
      />

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= LEFT COLUMN: KPIS + AGING + ACCOUNTS TABLE (1fr) ================= */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar gap-4">
          
          {/* KPI Tiles (4 metrics) */}
          <div className="grid grid-cols-4 gap-4 flex-shrink-0">
            <KpiTile
              label="ยอดลูกหนี้รวม"
              value="฿18.60M"
              variant="default"
            />
            <KpiTile
              label="เกินกำหนดชำระ"
              value="฿3.20M"
              subValue="(17%)"
              variant="danger"
            />
            <KpiTile
              label="DSO"
              value="41 วัน"
              variant="default"
            />
            <KpiTile
              label="ลูกค้า Grade C–D"
              value="58 ราย"
              variant="default"
            />
          </div>

          {/* Aging Stacked Bar */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <span>Aging ลูกหนี้</span>
              <span className="font-mono">รวม ฿18.60M</span>
            </div>

            {/* Stacked Multi-color Bar */}
            <div className="h-3.5 rounded-full overflow-hidden flex bg-divider shadow-inner">
              <div style={{ width: '82.8%' }} className="bg-[#3B82F6] hover:opacity-90 transition-opacity" title="ยังไม่ครบกำหนด ฿15.40M" />
              <div style={{ width: '10.2%' }} className="bg-[#06B6D4] hover:opacity-90 transition-opacity" title="1–30 วัน ฿1.90M" />
              <div style={{ width: '3.8%' }} className="bg-[#F59E0B] hover:opacity-90 transition-opacity" title="31–60 วัน ฿0.70M" />
              <div style={{ width: '1.9%' }} className="bg-[#EA580C] hover:opacity-90 transition-opacity" title="61–90 วัน ฿0.35M" />
              <div style={{ width: '1.3%' }} className="bg-[#E11D48] hover:opacity-90 transition-opacity" title="90+ วัน ฿0.25M" />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-text-secondary pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                <span>ยังไม่ครบกำหนด <strong className="font-mono text-text-primary">฿15.40M</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                <span>1–30 วัน <strong className="font-mono text-text-primary">฿1.90M</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>31–60 วัน <strong className="font-mono text-text-primary">฿0.70M</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                <span>61–90 วัน <strong className="font-mono text-text-primary">฿0.35M</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span>90+ วัน <strong className="font-mono text-text-primary">฿0.25M</strong></span>
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-card border border-border overflow-hidden shadow-card flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">
                บัญชีลูกค้าเครดิต · เรียงตามยอดเกินกำหนด
              </span>
              <button
                onClick={() => navigate('/segments')}
                className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1"
              >
                <span>ดู Segment Overdue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-muted text-text-secondary border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">ลูกค้า</th>
                    <th className="px-3.5 py-2.5 font-medium text-center">Grade</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">วงเงิน</th>
                    <th className="px-3.5 py-2.5 font-medium">ใช้ไป</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">เกินกำหนด</th>
                    <th className="px-3.5 py-2.5 font-medium text-center">Aging</th>
                    <th className="px-3.5 py-2.5 font-medium">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {mockCreditAccounts.map((acc) => {
                    const isHighUsage = acc.usedPercent > 80;
                    const isOverdue = acc.overdueAmount > 0;

                    return (
                      <tr
                        key={acc.id}
                        onClick={() => handleOpenCustomer(acc.customerId)}
                        className="hover:bg-bg-subtle cursor-pointer transition-colors"
                      >
                        <td className="px-3.5 py-2.5 font-semibold text-text-primary hover:text-brand">
                          {acc.customerName}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <GradeBadge grade={acc.grade} prefix="" size="sm" />
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-text-primary">
                          ฿{acc.limit.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 min-w-[120px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span>{acc.usedPercent}%</span>
                            </div>
                            <div className="w-full bg-divider h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isHighUsage ? 'bg-amber-500' : 'bg-brand'
                                }`}
                                style={{ width: `${Math.min(100, acc.usedPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                          <span
                            className={
                              isOverdue ? 'text-rose-600' : 'text-emerald-700'
                            }
                          >
                            ฿{acc.overdueAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              acc.aging === 'ปกติ'
                                ? 'text-emerald-600'
                                : acc.aging === '90+ วัน'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                acc.aging === 'ปกติ'
                                  ? 'bg-emerald-500'
                                  : acc.aging === '90+ วัน'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <span>{acc.aging}</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-text-body2">
                          {acc.nextAction}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: REQUESTS & DAILY FOLLOW-UP (340px) ================= */}
        <div className="w-[340px] flex-shrink-0 bg-white border-l border-border h-full p-4 space-y-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Card 1: คำขอเพิ่มวงเงิน */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  คำขอเพิ่มวงเงิน
                </span>
                <span className="text-xs font-mono font-semibold text-text-secondary">
                  2 รออนุมัติ
                </span>
              </div>

              {/* Request Cards */}
              <div className="space-y-3">
                {creditRequests.map((req) => {
                  if (req.status !== 'pending') return null;

                  return (
                    <div
                      key={req.id}
                      className="p-3 bg-bg-subtle rounded-card border border-border space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          onClick={() => handleOpenCustomer(req.customerId)}
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
                        ชำระตรงเวลา <strong className="text-emerald-700 font-mono">{req.onTimePaymentRate}%</strong> · Tier <strong className="font-mono">{req.tier}</strong>
                      </div>

                      {/* Approval Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleApprove(req.id, req.customerName)}
                          className="py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.customerName)}
                          className="py-1.5 border border-border hover:bg-white text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium transition-colors"
                        >
                          ไม่อนุมัติ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: ติดตามชำระวันนี้ */}
            <div className="p-3.5 bg-bg-subtle rounded-card border border-border space-y-2.5">
              <div className="text-xs font-bold text-text-primary">
                ติดตามชำระวันนี้
              </div>

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

          {/* Footnote / Security banner */}
          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-600 flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
            <span>Agent ทั่วไปเห็นเฉพาะสีสถานะเครดิต · ตัวเลขเห็นเฉพาะสิทธิ์ <code>credit.read</code></span>
          </div>

        </div>

      </div>

      {/* Modal: Collection Call List */}
      <Modal
        isOpen={isCallListModalOpen}
        onClose={() => setIsCallListModalOpen(false)}
        title="สร้าง Collection Call List ในระบบ 3CX"
        footer={
          <>
            <button
              onClick={() => setIsCallListModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateCallList}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              สร้าง Call List และส่งเข้า 3CX
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary">
            ระบบจะดึงรายชื่อลูกหนี้ที่ครบกำหนดชำระและเกินกำหนด 31–90 วัน (จำนวน 21 ราย) ส่งเข้าไปยังคิวโทรออกของระบบโทรศัพท์ 3CX ของทีมติดตามหนี้
          </p>
          <div className="p-3 bg-bg-subtle rounded-lg border border-border space-y-1 font-mono">
            <div>ลูกหนี้เกินกำหนด 31–60 วัน: <strong>8 ราย</strong></div>
            <div>ลูกหนี้เกินกำหนด 61–90 วัน: <strong>13 ราย</strong></div>
            <div>ยอดค้างชำระรวม: <strong className="text-rose-600">฿1,050,000</strong></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
