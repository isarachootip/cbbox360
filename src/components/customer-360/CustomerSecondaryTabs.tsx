import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Ticket } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface CustomerSecondaryTabsProps {
  activeTab: 'Service' | 'Segments';
  customer: Customer;
  tickets: Ticket[];
}

export const CustomerSecondaryTabs: React.FC<CustomerSecondaryTabsProps> = ({
  activeTab,
  customer,
  tickets,
}) => {
  const navigate = useNavigate();

  if (activeTab === 'Service') {
    return (
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
        {tickets
          .filter((t) => t.customerId === customer.id)
          .map((t) => (
            <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-bg-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-brand">{t.id}</span>
                  <span className="font-semibold text-[14px] text-text-primary">{t.title}</span>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {t.category} · ช่องทาง {t.channel} · {t.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-3 select-none">
                <StatusBadge status={t.status} />
                <button
                  type="button"
                  onClick={() => navigate('/cases')}
                  className="text-xs text-brand font-semibold hover:underline"
                >
                  เปิดดู
                </button>
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {customer.segments.map((seg, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl border border-border bg-bg-subtle flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-[13.5px] text-text-primary">{seg}</div>
            <div className="text-xs text-text-secondary mt-0.5">Dynamic CDP Cohort</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/segments')}
            className="text-xs text-brand font-semibold hover:underline select-none"
          >
            เปิดเงื่อนไข
          </button>
        </div>
      ))}
    </div>
  );
};
