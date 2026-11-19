import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { CustomerProfileCard } from '../components/customer-360/CustomerProfileCard';
import { EditCustomerModal } from '../components/customer-360/EditCustomerModal';
import { CustomerTimelineView } from '../components/customer-360/CustomerTimelineView';
import { CustomerRightSummaryColumn } from '../components/customer-360/CustomerRightSummaryColumn';
import { CustomerSearchBox } from '../components/customer-360/CustomerSearchBox';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { useBusinessTemplateState } from '../context/BusinessTemplateContext';
import { useIndustryProfile } from '../hooks/useIndustryProfile';
import { templateToIndustryKind } from '../domain/industry/industryVariables';
import { ActiveCallBanner } from '../components/telephony/ActiveCallBanner';
import { ExtensionSlot } from '../../core/client/registry/ExtensionSlot';
import { useLabel } from '../../core/client/hooks/useLabel';
import { useContactCustomFields } from '../../core/client/hooks/useContactCustomFields';
import { SensitivityAlertBanner } from '../../core/client/custom-fields/SensitivityAlertBanner';
import { IndustryHeaderAlertBridge } from '../../modules/industry-profiles/panelRegistry';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, contactLabel, contactPluralLabel } = useLabel();
  const {
    customers,
    selectedCustomer,
    setSelectedCustomerId,
    timelineEvents,
    deals,
    tickets,
    addCustomer,
    updateCustomer,
  } = useCustomer();

  const customer =
    customers.find((c) => c.id.toLowerCase() === (id || 'c00123').toLowerCase()) ||
    selectedCustomer;

  const { state: templateState } = useBusinessTemplateState();
  const cf = useContactCustomFields(customer.id);
  const industry = useIndustryProfile(
    customer.id,
    templateToIndustryKind(templateState.activeTemplateId)
  );

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);

  const customerDeal = deals.find(
    (d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const customerTicket = tickets.find(
    (t) => t.customerId === customer.id && t.status !== 'Closed'
  );

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
              {contactPluralLabel}
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
            <span>{t('contact.create_button', `${contactLabel}ใหม่`)}</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        <ActiveCallBanner customer={customer} className="max-w-[1640px] mx-auto mb-4" />
        <SensitivityAlertBanner banners={cf.banners} className="max-w-[1640px] mx-auto mb-4" />
        <ExtensionSlot name="contact.header.banner" contactId={customer.id} />
        <IndustryHeaderAlertBridge industry={industry} className="max-w-[1640px] mx-auto mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[332px_1fr_320px] gap-4 max-w-[1640px] mx-auto">
          <CustomerProfileCard
            customer={customer}
            onEditProfile={() => setIsEditCustomerModalOpen(true)}
          />
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
          />
        </div>
      </div>

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={(customerData) => {
          const created = addCustomer(customerData);
          showToast(`เพิ่ม${contactLabel} "${created.name}" เรียบร้อยแล้ว (${created.id})`, 'success');
          setSelectedCustomerId(created.id);
          navigate(`/customers/${created.id}`);
          return created;
        }}
      />

      <EditCustomerModal
        isOpen={isEditCustomerModalOpen}
        customer={customer}
        onClose={() => setIsEditCustomerModalOpen(false)}
        onSubmit={(updates) => {
          const updated = updateCustomer(customer.id, updates);
          if (updated) {
            showToast(`บันทึกข้อมูล${contactLabel} "${updated.name}" เรียบร้อยแล้ว`, 'success');
          }
        }}
      />
    </div>
  );
};
