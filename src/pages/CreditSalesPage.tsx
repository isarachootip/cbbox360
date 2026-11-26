import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { CreditAccountsTable } from '../components/credit/CreditAccountsTable';
import { CreditRightSidebar } from '../components/credit/CreditRightSidebar';
import { computeCreditPortfolioSummary } from '../domain/credit/creditKpiHelpers';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

export const CreditSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tenantId } = useTenantRuntime();
  const isDefaultTenant = tenantId === 'default';
  const {
    customers,
    creditAccounts,
    creditRequests,
    approveCreditLimit,
    rejectCreditLimit,
    setSelectedCustomerId,
  } = useCustomer();

  const [isCallListModalOpen, setIsCallListModalOpen] = useState(false);

  const summary = useMemo(
    () => computeCreditPortfolioSummary(creditAccounts, isDefaultTenant),
    [creditAccounts, isDefaultTenant]
  );

  const overdueAccounts = useMemo(
    () => creditAccounts.filter((a) => a.overdueAmount > 0),
    [creditAccounts]
  );

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

  const callListCount = isDefaultTenant ? 21 : overdueAccounts.length;

  const handleCreateCallList = () => {
    showToast(`สร้าง Collection Call List ${callListCount} รายการในระบบ 3CX เรียบร้อยแล้ว`, 'success');
    setIsCallListModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      <PageHeader
        title="Credit Sales & Collection"
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
            <KpiTile label="ยอดลูกหนี้รวม" value={summary.totalReceivablesText} variant="default" />
            <KpiTile
              label="เกินกำหนดชำระ"
              value={summary.overdueText}
              subValue={summary.overduePercentText}
              variant="danger"
            />
            <KpiTile label="DSO" value={summary.dsoText} variant="default" />
            <KpiTile label="ลูกค้า Grade C–D" value={summary.riskCustomerCountText} variant="default" />
          </div>

          <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <span>Aging ลูกหนี้ / พอร์ตผ่อนชำระ</span>
              <span className="font-mono">รวม {summary.totalReceivablesText}</span>
            </div>
            <div className="h-3.5 rounded-full overflow-hidden flex bg-divider shadow-inner">
              {summary.buckets.map((b) => (
                <div
                  key={b.label}
                  style={{ width: b.width }}
                  className={`${b.color} hover:opacity-90 transition-opacity`}
                  title={`${b.label} ${b.amount}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-text-secondary pt-1">
              {summary.buckets.map((b) => (
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
            accounts={creditAccounts}
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
            ระบบจะดึงรายชื่อสัญญาที่ครบกำหนดและค้างชำระ ({callListCount} รายการ)
            ส่งเข้าไปยังคิวโทรออกของระบบโทรศัพท์ 3CX ของทีมติดตามค่างวดภายใต้กรอบเวลาตาม พ.ร.บ.ทวงถามหนี้
          </p>
          <div className="p-3 bg-bg-subtle rounded-lg border border-border space-y-1 font-mono">
            <div>
              จำนวนสัญญาที่ต้องโทรติดตาม: <strong>{callListCount} ราย</strong>
            </div>
            <div>
              ยอดค้างชำระรวม: <strong className="text-rose-600">{summary.overdueText}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
