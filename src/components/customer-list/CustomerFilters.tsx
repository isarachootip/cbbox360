import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { TenantFieldDefinition } from '../../../core/client/providers/TenantRuntimeContext';

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedTier: string;
  onTierChange: (val: string) => void;
  selectedSecondaryFilter: string;
  onSecondaryFilterChange: (val: string) => void;
  contactLabel: string;
  isCommercialB2B: boolean;
  primaryUniqueLabel?: string;
  dynamicSelectField?: TenantFieldDefinition;
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

const TIERS: { label: string; value: string }[] = [
  { label: 'ทุกระดับ Tier', value: 'all' },
  { label: 'Platinum', value: 'PLATINUM' },
  { label: 'Gold', value: 'GOLD' },
  { label: 'Silver', value: 'SILVER' },
  { label: 'Member', value: 'MEMBER' },
];

const GRADES: { label: string; value: string }[] = [
  { label: 'ทุกเกรดเครดิต', value: 'all' },
  { label: 'Grade A', value: 'A' },
  { label: 'Grade B', value: 'B' },
  { label: 'Grade C', value: 'C' },
  { label: 'Grade D', value: 'D' },
];

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  selectedSecondaryFilter,
  onSecondaryFilterChange,
  contactLabel,
  isCommercialB2B,
  primaryUniqueLabel,
  dynamicSelectField,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' || selectedTier !== 'all' || selectedSecondaryFilter !== 'all';

  const placeholder = primaryUniqueLabel
    ? `ค้นหา ชื่อ${contactLabel}, ${primaryUniqueLabel}, เบอร์โทรศัพท์...`
    : `ค้นหา ชื่อ${contactLabel}, ชื่อเล่น, รหัส, เบอร์โทรศัพท์...`;

  const secondaryOptions = isCommercialB2B
    ? GRADES
    : dynamicSelectField?.options
      ? [
          { label: `ทุก${dynamicSelectField.label}`, value: 'all' },
          ...dynamicSelectField.options.map((o) => ({ label: o.label, value: o.value })),
        ]
      : null;

  return (
    <div className="bg-white border border-border rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all text-text-primary placeholder:text-text-placeholder"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="items-center gap-1.5 text-xs text-text-secondary font-medium mr-1 hidden sm:flex">
          <Filter className="w-3.5 h-3.5" />
          <span>ตัวกรอง:</span>
        </div>

        <select
          value={selectedTier}
          onChange={(e) => onTierChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-bg-app border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {secondaryOptions && (
          <select
            value={selectedSecondaryFilter}
            onChange={(e) => onSecondaryFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-bg-app border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
          >
            {secondaryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-secondary hover:text-brand hover:bg-brand-tint rounded-lg transition-colors cursor-pointer"
            title="ล้างตัวกรอง"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}

        <div className="text-xs text-text-secondary ml-auto md:ml-2 font-medium">
          แสดง <span className="font-bold text-text-primary">{filteredCount}</span> จาก {totalCount} ราย
        </div>
      </div>
    </div>
  );
};
