import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { CreditAccountsTable } from '../components/credit/CreditAccountsTable';
import { CreditRightSidebar } from '../components/credit/CreditRightSidebar';
import { mockCreditAccounts } from '../data/credit';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';

const AGING_BUCKETS = [
  { label: 'ยังไม่ครบกำหนด', amount: '฿15.40M', width: '82.8%', color: 'bg-[#3B82F6]' },
  { label: '1–30 วัน', amount: '฿1.90M', width: '10.2%', color: 'bg-[#06B6D4]' },
  { label: '31–60 วัน', amount: '฿0.70M', width: '3.8%', color: 'bg-[#F59E0B]' },
  { label: '61–90 วัน', amount: '฿0.35M', width: '1.9%', color: 'bg-[#EA580C]' },
  { label: '90+ วัน', amount: '฿0.25M', width: '1.3%', color: 'bg-[#E11D48]' },
];

export const CreditSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    customers,
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
      <PageHeader
        title="Credit Sales"
        actionButton={
          <button
            type="button"
            onClick={() => setIsCallListModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>สร้าง Collection call list</span>
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar gap-4">
          <div className="grid grid-cols-4 gap-4 flex-shrink-0">
            <KpiTile label="ยอดลูกหนี้รวม" value="฿18.60M" variant="default" />
            <KpiTile label="เกินกำหนดชำระ" value="฿3.20M" subValue="(17%)" variant="danger" />
            <KpiTile label="DSO" value="41 วัน" variant="default" />
            <KpiTile label="ลูกค้า Grade C–D" value="58 ราย" variant="default" />
          </div>

          <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <span>Aging ลูกหนี้</span>
              <span className="font-mono">รวม ฿18.60M</span>
            </div>
            <div className="h-3.5 rounded-full overflow-hidden flex bg-divider shadow-inner">
              {AGING_BUCKETS.map((b) => (
                <div
                  key={b.label}
                  style={{ width: b.width }}
                  className={`${b.color} hover:opacity-90 transition-opacity`}
                  title={`${b.label} ${b.amount}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-text-secondary pt-1">
              {AGING_BUCKETS.map((b) => (
                <div key={b.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                  <span>
                    {b.label} <strong className="font-mono text-text-primary">{b.amount}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CreditAccountsTable
            accounts={mockCreditAccounts}
            customers={customers}
            onOpenCustomer={handleOpenCustomer}
            onViewOverdueSegment={() => navigate('/segments')}
          />
        </div>

        <CreditRightSidebar
          creditRequests={creditRequests}
          onOpenCustomer={handleOpenCustomer}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>

      <Modal
        isOpen={isCallListModalOpen}
        onClose={() => setIsCallListModalOpen(false)}
        title="สร้าง Collection Call List ในระบบ 3CX"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCallListModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleCreateCallList}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              สร้าง Call List และส่งเข้า 3CX
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary">
            ระบบจะดึงรายชื่อลูกหนี้ที่ครบกำหนดชำระและเกินกำหนด 31–90 วัน (จำนวน 21 ราย)
            ส่งเข้าไปยังคิวโทรออกของระบบโทรศัพท์ 3CX ของทีมติดตามหนี้
          </p>
          <div className="p-3 bg-bg-subtle rounded-lg border border-border space-y-1 font-mono">
            <div>
              ลูกหนี้เกินกำหนด 31–60 วัน: <strong>8 ราย</strong>
            </div>
            <div>
              ลูกหนี้เกินกำหนด 61–90 วัน: <strong>13 ราย</strong>
            </div>
            <div>
              ยอดค้างชำระรวม: <strong className="text-rose-600">฿1,050,000</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
