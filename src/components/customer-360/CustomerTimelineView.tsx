import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Customer, Ticket, TimelineEvent } from '../../types';
import { ContactsTab } from './ContactsTab';
import { AddressesTab } from './AddressesTab';
import { CustomerSecondaryTabs } from './CustomerSecondaryTabs';
import { IndustryProfileTab, INDUSTRY_TAB_LABELS } from './industry/IndustryProfileTab';
import { useIndustryProfile } from '../../hooks/useIndustryProfile';

export type Customer360Tab =
  | 'Timeline'
  | 'Orders'
  | 'Service'
  | 'Credit'
  | 'Contacts'
  | 'Addresses'
  | 'Segments'
  | 'Industry';

interface CustomerTimelineViewProps {
  customer: Customer;
  timelineEvents: TimelineEvent[];
  tickets: Ticket[];
  industry: ReturnType<typeof useIndustryProfile>;
}

const ICON_SCHEME: Record<TimelineEvent['colorScheme'], string> = {
  green: 'bg-[#E3F7EA] text-[#0B6B34]',
  blue: 'bg-[#E6EEFF] text-[#1146A8]',
  purple: 'bg-[#E9E7F5] text-[#4A3F8C]',
  teal: 'bg-[#E0F2FE] text-[#0E7490]',
  amber: 'bg-[#FDF6E9] text-[#7A4F00]',
};

export const CustomerTimelineView: React.FC<CustomerTimelineViewProps> = ({
  customer,
  timelineEvents,
  tickets,
  industry,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Customer360Tab>('Timeline');
  const [timelineFilter, setTimelineFilter] = useState<string>('ทั้งหมด');

  const tabs: Customer360Tab[] = [
    'Timeline',
    'Orders',
    'Service',
    'Credit',
    'Contacts',
    'Addresses',
    'Segments',
    ...(industry.kind ? (['Industry'] as const) : []),
  ];

  const labelMap: Record<Customer360Tab, string> = {
    Timeline: 'Timeline',
    Orders: 'Orders',
    Service: 'Service',
    Credit: 'Credit',
    Contacts: `ผู้ติดต่อ (${(customer.contacts || []).length})`,
    Addresses: `ที่อยู่ & พิกัด (${(customer.addresses || []).length})`,
    Segments: 'Segments',
    Industry: industry.kind ? INDUSTRY_TAB_LABELS[industry.kind] : '',
  };

  const filteredEvents = timelineEvents.filter(
    (evt) => timelineFilter === 'ทั้งหมด' || evt.type === timelineFilter
  );

  return (
    <div className="bg-white rounded-card border border-border flex flex-col shadow-card overflow-hidden min-w-0">
      <div className="border-b border-border px-5 flex items-center gap-5 bg-white overflow-x-auto custom-scrollbar select-none">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 text-[13.5px] font-semibold transition-all relative shrink-0 ${
              activeTab === tab ? 'text-brand' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {labelMap[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'Timeline' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 flex-wrap select-none">
              <span className="text-xs text-text-secondary font-medium">กรอง:</span>
              {['ทั้งหมด', 'Order', 'แชท', 'โทร', 'Ticket', 'Deal'].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setTimelineFilter(filter)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    timelineFilter === filter
                      ? 'bg-brand text-white shadow-2xs'
                      : 'bg-bg-subtle text-text-secondary hover:bg-bg-muted border border-border'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider">
              {filteredEvents.map((evt) => (
                <div key={evt.id} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-7 h-7 rounded-full font-bold font-mono text-[11px] flex items-center justify-center border-2 border-white shadow-2xs select-none ${ICON_SCHEME[evt.colorScheme]}`}
                  >
                    {evt.iconCode}
                  </div>
                  <div className="bg-bg-subtle border border-border/90 rounded-xl p-4 hover:border-brand/30 transition-all">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-[14px] text-text-primary">{evt.title}</span>
                      <span className="text-xs text-text-secondary font-mono tabular-nums">{evt.time}</span>
                    </div>
                    <p className="text-[13.5px] text-text-body2 mt-1.5 leading-[1.6]">{evt.detail}</p>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-divider text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {evt.meta.map((m, idx) => (
                          <span key={idx} className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded-md border border-border">
                            {m}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(evt.linkRoute)}
                        className="text-brand hover:text-brand-hover font-semibold text-xs flex items-center gap-1 select-none"
                      >
                        <span>{evt.linkText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'Orders' ||
          activeTab === 'Service' ||
          activeTab === 'Credit' ||
          activeTab === 'Segments') && (
          <CustomerSecondaryTabs activeTab={activeTab} customer={customer} tickets={tickets} />
        )}

        {activeTab === 'Contacts' && <ContactsTab customer={customer} />}
        {activeTab === 'Addresses' && <AddressesTab customer={customer} />}
        {activeTab === 'Industry' && <IndustryProfileTab industry={industry} />}
      </div>
    </div>
  );
};
