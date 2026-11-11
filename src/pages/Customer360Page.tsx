import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/common/Modal';
import { CustomerProfileCard } from '../components/customer-360/CustomerProfileCard';
import { CustomerTimelineView } from '../components/customer-360/CustomerTimelineView';
import { CustomerRightSummaryColumn } from '../components/customer-360/CustomerRightSummaryColumn';
import { CustomerSearchBox } from '../components/customer-360/CustomerSearchBox';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { useBusinessTemplateState } from '../context/BusinessTemplateContext';
import { useIndustryProfile } from '../hooks/useIndustryProfile';
import { templateToIndustryKind } from '../domain/industry/industryVariables';
import { AllergyAlertBanner } from '../components/customer-360/industry/AllergyAlertBanner';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    customers,
    selectedCustomer,
    setSelectedCustomerId,
    timelineEvents,
    deals,
    tickets,
    addTicket,
    addCustomer,
  } = useCustomer();

  const customer =
    customers.find((c) => c.id.toLowerCase() === (id || 'c00123').toLowerCase()) ||
    selectedCustomer;

  const { state: templateState } = useBusinessTemplateState();
  const industry = useIndustryProfile(
    customer.id,
    templateToIndustryKind(templateState.activeTemplateId)
  );

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isCreditTaskModalOpen, setIsCreditTaskModalOpen] = useState(false);

  const handleCreateCreditTask = () => {
    addTicket({
      customerId: customer.id,
      customerName: customer.name,
      customerTier: customer.tier,
      title: `เสนอเพิ่มวงเงินเครดิตเป็น ฿400,000 (${customer.name})`,
      category: 'Credit',
      channel: 'LINE',
      status: 'Open',
      slaHoursLeft: 24,
      slaFormatted: '1 วัน',
      slaStatus: 'normal',
      assignee: 'ประเทือง ว.',
    });
    showToast('สร้าง Task ให้ทีมสินเชื่อเรียบร้อยแล้ว (อัปเดตใน Service & Case)', 'success');
    setIsCreditTaskModalOpen(false);
  };

  const customerDeal =
    deals.find(
      (d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    ) || deals[0];
  const customerTicket =
    tickets.find((t) => t.customerId === customer.id && t.status !== 'Closed') || tickets[1];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13.5px]">
            <Link to="/customers" className="hover:text-brand transition-colors">
              CDP
            </Link>
            <span>/</span>
            <Link
              to="/customers"
              className="hover:text-brand hover:underline font-medium transition-colors"
            >
              ลูกค้า
            </Link>
            <span>/</span>
            <span className="font-bold text-text-primary text-[14.5px]">{customer.name}</span>
          </div>
        }
        centerControls={
          <CustomerSearchBox
            customers={customers}
            onSelectCustomer={(custId) => {
              setSelectedCustomerId(custId);
              navigate(`/customers/${custId}`);
            }}
          />
        }
        actionButton={
          <button
            type="button"
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ลูกค้าใหม่</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        <AllergyAlertBanner
          profile={industry.profile}
          redacted={industry.redacted}
          className="max-w-[1640px] mx-auto mb-4"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[332px_1fr_320px] gap-4 max-w-[1640px] mx-auto">
          <CustomerProfileCard customer={customer} />
          <CustomerTimelineView
            customer={customer}
            timelineEvents={timelineEvents}
            tickets={tickets}
            industry={industry}
          />
          <CustomerRightSummaryColumn
            customer={customer}
            customerDeal={customerDeal}
            customerTicket={customerTicket}
            onOpenCreditTaskModal={() => setIsCreditTaskModalOpen(true)}
          />
        </div>
      </div>

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={(customerData) => {
          const created = addCustomer(customerData);
          showToast(`เพิ่มลูกค้า "${created.name}" เรียบร้อยแล้ว (${created.id})`, 'success');
          setSelectedCustomerId(created.id);
          navigate(`/customers/${created.id}`);
          return created;
        }}
      />

      <Modal
        isOpen={isCreditTaskModalOpen}
        onClose={() => setIsCreditTaskModalOpen(false)}
        title="สร้าง Task พิจารณาเพิ่มวงเงินให้ทีมสินเชื่อ"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreditTaskModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleCreateCreditTask}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              ยืนยันสร้าง Task
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <p className="text-text-secondary">
            ส่งคำขอสร้าง Ticket ในโมดูล Credit Sales & Service เพื่อให้ผู้รับผิดชอบตรวจสอบและปรับวงเงิน
          </p>
          <div className="bg-bg-subtle p-3.5 rounded-xl border border-border space-y-1.5 font-mono text-xs tabular-nums">
            <div>ลูกค้า: <strong>{customer.name}</strong> ({customer.id})</div>
            <div>วงเงินปัจจุบัน: <strong>฿{customer.creditLimit.toLocaleString()}</strong></div>
            <div>วงเงินที่เสนอใหม่: <strong className="text-emerald-700">฿400,000</strong></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
