import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PhoneCall, Settings, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { UnknownCallerCard } from '../components/telephony/UnknownCallerCard';
import { MultiMatchCallerCard } from '../components/telephony/MultiMatchCallerCard';
import { useCustomer } from '../context/CustomerContext';
import { useTelephony } from '../context/TelephonyContext';
import { useToast } from '../context/ToastContext';
import { parseScreenPopQuery } from '../domain/telephony/screenPopSchema';
import {
  buildScreenPopUrlTemplate,
  matchCustomersByPhone,
} from '../domain/telephony/phoneMatcher';
import type { Customer, CustomerPhoneMatch } from '../types';

export const CtiScreenPopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { customers, setSelectedCustomerId, addCustomer, addContact } = useCustomer();
  const { registerScreenPopCall, attachCustomerToActiveCall } = useTelephony();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const query = useMemo(() => parseScreenPopQuery(searchParams), [searchParams]);
  const matches = useMemo(
    () => matchCustomersByPhone(customers, query.rawNumber),
    [customers, query.rawNumber]
  );

  const buildCustomerCallUrl = (customerId: string): string => {
    const params = new URLSearchParams();
    params.set('callNumber', query.displayNumber);
    if (query.ext) params.set('ext', query.ext);
    if (query.callId) params.set('callId', query.callId);
    return `/customers/${customerId}?${params.toString()}`;
  };

  useEffect(() => {
    if (!query.normalizedNumber) return;

    if (matches.length === 1) {
      const match = matches[0];
      registerScreenPopCall(query, match);
      setSelectedCustomerId(match.customer.id);
      navigate(buildCustomerCallUrl(match.customer.id), { replace: true });
      return;
    }

    registerScreenPopCall(query);
  }, [query, matches, navigate, registerScreenPopCall, setSelectedCustomerId]);

  const handleSelectMatch = (match: CustomerPhoneMatch) => {
    attachCustomerToActiveCall(match.customer.id, match.customer.name, match.matchedLabel);
    setSelectedCustomerId(match.customer.id);
    navigate(buildCustomerCallUrl(match.customer.id), { replace: true });
  };

  const handleLinkCustomer = (customer: Customer, contactName: string) => {
    addContact(customer.id, {
      name: contactName,
      roleOrTitle: 'เพิ่มจากสายเรียกเข้า 3CX',
      phone: query.displayNumber,
      isPrimary: false,
    });
    attachCustomerToActiveCall(customer.id, customer.name, contactName);
    setSelectedCustomerId(customer.id);
    showToast(`ผูกเบอร์ ${query.displayNumber} กับ "${customer.name}" เรียบร้อยแล้ว`, 'success');
    navigate(buildCustomerCallUrl(customer.id), { replace: true });
  };

  const templateUrl = buildScreenPopUrlTemplate(window.location.origin);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13.5px]">
            <span>Voice (3CX)</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[15px]">CTI Screen-Pop</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex items-start justify-center">
        {!query.normalizedNumber ? (
          <div className="bg-white border border-border rounded-card p-6 shadow-card max-w-xl w-full space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-subtle border border-border text-brand flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  จุดรับลิงก์ 3CX / Telephony Screen-Pop
                </h2>
                <p className="text-text-secondary">
                  กรุณาระบุพารามิเตอร์ <code className="font-mono text-brand">?number=082xxxxxxx</code>{' '}
                  จากระบบโทรศัพท์เพื่อเปิดโปรไฟล์ลูกค้าอัตโนมัติ
                </p>
              </div>
            </div>
            <div className="p-3 bg-bg-subtle rounded-lg border border-border font-mono text-[11px] text-text-primary break-all">
              {templateUrl}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Link
                to="/connectors"
                className="px-3.5 py-2 border border-border rounded-lg font-semibold text-text-primary hover:bg-bg-subtle flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>ตั้งค่า 3CX Connector</span>
              </Link>
              <Link
                to="/voice"
                className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <span>ไปหน้าจำลองสายเรียกเข้า</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : matches.length > 1 ? (
          <MultiMatchCallerCard
            query={query}
            matches={matches}
            onSelectMatch={handleSelectMatch}
          />
        ) : matches.length === 0 ? (
          <UnknownCallerCard
            query={query}
            customers={customers}
            onOpenNewCustomer={() => setIsNewModalOpen(true)}
            onLinkExistingCustomer={handleLinkCustomer}
          />
        ) : null}
      </div>

      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        initialPhone={query.displayNumber}
        onSubmit={(customerData) => {
          const created = addCustomer(customerData);
          attachCustomerToActiveCall(created.id, created.name, created.name);
          setSelectedCustomerId(created.id);
          showToast(`สร้างลูกค้าใหม่ "${created.name}" จากสาย 3CX สำเร็จ`, 'success');
          navigate(buildCustomerCallUrl(created.id), { replace: true });
          return created;
        }}
      />
    </div>
  );
};
