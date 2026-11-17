import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronRight, FileJson } from 'lucide-react';
import type { ConsentFilterPreset, Customer } from '../../types';
import type { ToggleableConsentKey } from '../../hooks/useConsentManagement';
import {
  filterConsentCustomers,
  resolveCustomerConsent,
} from '../../domain/consent/consentMetrics';
import { TierBadge } from '../common/TierBadge';
import { ConsentToggleSwitch } from './ConsentToggleSwitch';

interface ConsentRegistryTabProps {
  customers: Customer[];
  onSelectCustomerId: (id: string) => void;
  onToggleConsent: (customer: Customer, key: ToggleableConsentKey, label: string) => void;
  onExportCustomerJson: (customer: Customer) => void;
  onExportFilteredCsv: (filtered: readonly Customer[]) => void;
}

const FILTER_PRESETS: { key: ConsentFilterPreset; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'line_opt_in', label: 'ยินยอม LINE OA' },
  { key: 'all_opted_out', label: 'ถอนการตลาดทุกช่องทาง' },
  { key: 'sensitive_granted', label: 'ยินยอม ม.26 (ข้อมูลสุขภาพ)' },
];

export const ConsentRegistryTab: React.FC<ConsentRegistryTabProps> = ({
  customers,
  onSelectCustomerId,
  onToggleConsent,
  onExportCustomerJson,
  onExportFilteredCsv,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [preset, setPreset] = useState<ConsentFilterPreset>('all');

  const filtered = useMemo(
    () => filterConsentCustomers(customers, searchQuery, preset),
    [customers, searchQuery, preset]
  );

  return (
    <div className="space-y-3.5">
      <div className="bg-white border border-border rounded-card p-3.5 shadow-card flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 flex-1">
          <div className="relative min-w-[260px] md:w-72 shrink-0">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, รหัส C00xxx, เบอร์โทร, อีเมล..."
              className="w-full pl-9 pr-3.5 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_PRESETS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPreset(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  preset === item.key
                    ? 'bg-brand text-white'
                    : 'bg-bg-subtle text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3">
          <span className="text-xs text-text-secondary font-mono tabular-nums">
            แสดง {filtered.length} จาก {customers.length} ราย
          </span>
          <button
            type="button"
            onClick={() => onExportFilteredCsv(filtered)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-lg text-xs font-semibold text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted text-text-secondary text-xs font-medium">
                <th className="py-3 px-4 font-medium">ลูกค้า / องค์กร</th>
                <th className="py-3 px-3 font-medium text-center">ช่องทางการตลาด (Opt-in / Opt-out)</th>
                <th className="py-3 px-3 font-medium text-center">วัตถุประสงค์ PDPA</th>
                <th className="py-3 px-4 font-medium">แหล่งที่มา · เวอร์ชัน</th>
                <th className="py-3 px-4 font-medium text-right">จัดการ / สำเนา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((customer) => {
                const cs = resolveCustomerConsent(customer);
                return (
                  <tr key={customer.id} className="hover:bg-bg-subtle/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-tint text-brand-deep font-semibold flex items-center justify-center text-xs shrink-0">
                          {customer.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCustomerId(customer.id);
                                navigate(`/customers/${customer.id}`);
                              }}
                              className="font-semibold text-sm text-text-primary hover:text-brand transition-colors truncate cursor-pointer text-left"
                            >
                              {customer.name}
                            </button>
                            <TierBadge tier={customer.tier} size="sm" />
                          </div>
                          <div className="text-xs text-text-muted font-mono tabular-nums mt-0.5">
                            {customer.id} · {customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <ConsentToggleSwitch checked={cs.marketingLine} label="LINE" onToggle={() => onToggleConsent(customer, 'marketingLine', 'LINE OA')} />
                        <ConsentToggleSwitch checked={cs.marketingEmail} label="Email" onToggle={() => onToggleConsent(customer, 'marketingEmail', 'Email')} />
                        <ConsentToggleSwitch checked={cs.marketingSms} label="SMS" onToggle={() => onToggleConsent(customer, 'marketingSms', 'SMS')} />
                        <ConsentToggleSwitch checked={cs.marketingPhone} label="3CX โทร" onToggle={() => onToggleConsent(customer, 'marketingPhone', 'โทรศัพท์ 3CX')} />
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <ConsentToggleSwitch checked={cs.profilingAnalytics} label="CDP วิเคราะห์" accent="brand" onToggle={() => onToggleConsent(customer, 'profilingAnalytics', 'CDP Profiling')} />
                        <ConsentToggleSwitch checked={cs.sensitiveMedical} label="ม.26 สุขภาพ" accent="purple" onToggle={() => onToggleConsent(customer, 'sensitiveMedical', 'ข้อมูลอ่อนไหว ม.26')} />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-text-primary">
                        Policy <span className="font-mono text-brand">{cs.policyVersion}</span> ·{' '}
                        {cs.consentSource}
                      </div>
                      <div className="text-text-muted font-mono mt-0.5">อัปเดต: {cs.updatedAt}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onExportCustomerJson(customer)}
                          title="ดาวน์โหลดสำเนาข้อมูล JSON (Data Portability)"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white transition-colors cursor-pointer"
                        >
                          <FileJson className="w-3.5 h-3.5 text-brand" />
                          <span>JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCustomerId(customer.id);
                            navigate(`/customers/${customer.id}`);
                          }}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand-tint rounded-lg transition-colors cursor-pointer"
                        >
                          <span>360°</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
