import React from 'react';
import {
  PERSON_PREFIX_OPTIONS,
  formatPersonFullName,
} from '../../domain/customer/personName';

export interface PersonNameDraft {
  prefix: string;
  firstName: string;
  lastName: string;
  nickname: string;
}

interface PersonNameFieldsProps {
  value: PersonNameDraft;
  onChange: (next: PersonNameDraft) => void;
  firstNameRequired?: boolean;
  compact?: boolean;
  firstNameError?: string;
  autoFocusFirstName?: boolean;
}

export const EMPTY_PERSON_NAME_DRAFT: PersonNameDraft = {
  prefix: '',
  firstName: '',
  lastName: '',
  nickname: '',
};

export const PersonNameFields: React.FC<PersonNameFieldsProps> = ({
  value,
  onChange,
  firstNameRequired = true,
  compact = false,
  firstNameError,
  autoFocusFirstName = false,
}) => {
  const hasCustomPrefix =
    value.prefix.trim() !== '' &&
    !(PERSON_PREFIX_OPTIONS as readonly string[]).includes(value.prefix);

  const previewFullName = formatPersonFullName(value);
  const inputPadding = compact ? 'px-3 py-2' : 'px-3.5 py-2.5';
  const baseInputClass = `w-full ${inputPadding} border rounded-lg bg-white text-text-primary text-sm transition-all focus:outline-none focus:ring-2`;
  const normalBorder = 'border-border focus:border-brand focus:ring-brand/20';
  const errorBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">คำนำหน้า</label>
          <select
            value={value.prefix}
            onChange={(e) => onChange({ ...value, prefix: e.target.value })}
            className={`${baseInputClass} ${normalBorder}`}
          >
            {hasCustomPrefix && <option value={value.prefix}>{value.prefix}</option>}
            {PERSON_PREFIX_OPTIONS.map((opt) => (
              <option key={opt || 'none'} value={opt}>
                {opt || 'ไม่ระบุ'}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-5">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            ชื่อ {firstNameRequired && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            autoFocus={autoFocusFirstName}
            required={firstNameRequired}
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            placeholder="เช่น สมชาย"
            aria-invalid={Boolean(firstNameError)}
            className={`${baseInputClass} ${firstNameError ? errorBorder : normalBorder}`}
          />
          {firstNameError && (
            <p className="mt-1 text-xs font-medium text-rose-600">{firstNameError}</p>
          )}
        </div>

        <div className="sm:col-span-4">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            นามสกุล{' '}
            <span className="text-xs text-text-muted font-normal whitespace-nowrap">(ไม่บังคับ)</span>
          </label>
          <input
            type="text"
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            placeholder="เช่น ใจดี"
            className={`${baseInputClass} ${normalBorder}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
        <div className={compact ? 'sm:col-span-12' : 'sm:col-span-6'}>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            ชื่อเล่น / ชื่อเรียกในแชท{' '}
            <span className="text-xs text-text-muted font-normal whitespace-nowrap">(ไม่บังคับ)</span>
          </label>
          <input
            type="text"
            value={value.nickname}
            onChange={(e) => onChange({ ...value, nickname: e.target.value })}
            placeholder="เช่น ชาย, เฮียชาย"
            className={`${baseInputClass} ${normalBorder}`}
          />
        </div>

        {!compact && (
          <div className="sm:col-span-6">
            <div className="px-3.5 py-2.5 min-h-[42px] rounded-lg bg-bg-subtle border border-border text-sm text-text-secondary flex items-center justify-between gap-2">
              <span className="text-xs font-medium shrink-0">ชื่อแสดงผลอัตโนมัติ:</span>
              <span className="font-semibold text-text-primary truncate">
                {previewFullName
                  ? `${previewFullName}${value.nickname.trim() ? ` (${value.nickname.trim()})` : ''}`
                  : '— รอกรอกชื่อ —'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
