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
}) => {
  const hasCustomPrefix =
    value.prefix.trim() !== '' &&
    !(PERSON_PREFIX_OPTIONS as readonly string[]).includes(value.prefix);

  const previewFullName = formatPersonFullName(value);
  const inputPadding = compact ? 'px-2.5 py-1.5' : 'px-3 py-2';

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-3">
          <label className="block text-text-secondary font-medium mb-1">คำนำหน้า</label>
          <select
            value={value.prefix}
            onChange={(e) => onChange({ ...value, prefix: e.target.value })}
            className={`w-full ${inputPadding} border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary text-xs`}
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
          <label className="block text-text-secondary font-medium mb-1">
            ชื่อ {firstNameRequired && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required={firstNameRequired}
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            placeholder="เช่น สมชาย"
            className={`w-full ${inputPadding} border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary text-xs`}
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-text-secondary font-medium mb-1">
            นามสกุล <span className="text-text-secondary/70 font-normal">(ไม่บังคับ)</span>
          </label>
          <input
            type="text"
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            placeholder="เช่น ใจดี"
            className={`w-full ${inputPadding} border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary text-xs`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className={compact ? 'sm:col-span-12' : 'sm:col-span-5'}>
          <label className="block text-text-secondary font-medium mb-1">
            ชื่อเล่น / ชื่อเรียกในแชท <span className="text-text-secondary/70 font-normal">(ไม่บังคับ)</span>
          </label>
          <input
            type="text"
            value={value.nickname}
            onChange={(e) => onChange({ ...value, nickname: e.target.value })}
            placeholder="เช่น ชาย, เฮียชาย"
            className={`w-full ${inputPadding} border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary text-xs`}
          />
        </div>

        {!compact && (
          <div className="sm:col-span-7">
            <div className="px-3 py-2 rounded-lg bg-bg-subtle border border-border/80 text-[11px] text-text-secondary flex items-center justify-between gap-2">
              <span>ชื่อแสดงผลอัตโนมัติ:</span>
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
