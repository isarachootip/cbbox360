import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { TierType, CreditGrade } from '../../types';

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedTier: string;
  onTierChange: (val: string) => void;
  selectedGrade: string;
  onGradeChange: (val: string) => void;
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
  selectedGrade,
  onGradeChange,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const isFiltered = searchQuery.trim() !== '' || selectedTier !== 'all' || selectedGrade !== 'all';

  return (
    <div className="bg-white border border-border rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="ค้นหาชื่อ, รหัสลูกค้า, เบอร์โทรศัพท์, อีเมล..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all text-text-primary placeholder:text-text-placeholder"
        />
      </div>

      {/* Filter Dropdowns and Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium mr-1 hidden sm:flex">
          <Filter className="w-3.5 h-3.5" />
          <span>ตัวกรอง:</span>
        </div>

        {/* Tier Filter */}
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

        {/* Credit Grade Filter */}
        <select
          value={selectedGrade}
          onChange={(e) => onGradeChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-bg-app border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
        >
          {GRADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-secondary hover:text-brand hover:bg-brand-tint rounded-lg transition-colors cursor-pointer"
            title="ล้างตัวกรอง"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}

        {/* Results Counter */}
        <div className="text-xs text-text-secondary ml-auto md:ml-2 font-medium">
          แสดง <span className="font-bold text-text-primary">{filteredCount}</span> จาก {totalCount} ราย
        </div>
      </div>
    </div>
  );
};
