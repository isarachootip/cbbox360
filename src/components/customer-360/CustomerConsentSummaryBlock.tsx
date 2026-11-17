import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck } from 'lucide-react';
import type { Customer } from '../../types';
import { resolveCustomerConsent } from '../../domain/consent/consentMetrics';

interface CustomerConsentSummaryBlockProps {
  customer: Customer;
}

export const CustomerConsentSummaryBlock: React.FC<CustomerConsentSummaryBlockProps> = ({
  customer,
}) => {
  const cs = resolveCustomerConsent(customer);
  const items: { label: string; granted: boolean }[] = [
    { label: 'LINE', granted: cs.marketingLine },
    { label: 'Email', granted: cs.marketingEmail },
    { label: 'SMS', granted: cs.marketingSms },
    { label: '3CX', granted: cs.marketingPhone },
    { label: 'ม.26', granted: cs.sensitiveMedical },
  ];

  return (
    <div className="border-t border-divider pt-3.5 space-y-2 select-none">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Consent (PDPA · {cs.policyVersion})</span>
        </span>
        <Link
          to="/consent"
          className="font-semibold text-brand hover:underline"
        >
          จัดการ →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2.5 text-xs">
        {items.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1 font-medium ${
              item.granted ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            <span>{item.label}</span>
            {item.granted ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-500" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
};
