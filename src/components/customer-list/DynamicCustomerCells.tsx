import React from 'react';
import { TenantFieldDefinition } from '../../../core/client/providers/TenantRuntimeContext';
import { ContactCustomFieldSummary } from '../../../core/client/hooks/useContactListCustomFields';

interface DynamicCustomerCellProps {
  definition: TenantFieldDefinition;
  summary?: ContactCustomFieldSummary;
}

/**
 * Renders a single custom-field column cell inside `CustomerTable`.
 * Strictly adheres to CB360 Clean UI Status Rule (transparent background + dot indicator + colored text).
 */
export const DynamicCustomerCell: React.FC<DynamicCustomerCellProps> = ({
  definition,
  summary,
}) => {
  const raw = summary?.values?.[definition.key];
  const redactInfo = summary?.redactedFlags?.[definition.key];
  const isAlertOrSensitive =
    Boolean(definition.ui?.alertBanner?.whenNonEmpty) || definition.sensitivity === 'pdpa_s26';

  if (isAlertOrSensitive) {
    if (redactInfo?.redacted) {
      return (
        <td className="py-3 px-4 select-none">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>จำกัดสิทธิ์ (PDPA ม.26)</span>
          </span>
        </td>
      );
    }

    const items = Array.isArray(raw)
      ? raw.filter(Boolean).map(String)
      : raw !== undefined && raw !== null && raw !== ''
        ? [String(raw)]
        : [];

    if (items.length > 0) {
      return (
        <td className="py-3 px-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate max-w-[180px]">{items.join(', ')}</span>
          </span>
        </td>
      );
    }

    return (
      <td className="py-3 px-4 select-none">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>ปกติ</span>
        </span>
      </td>
    );
  }

  if (definition.validation?.unique) {
    return (
      <td className="py-3 px-4 font-mono text-xs font-semibold text-brand-deep whitespace-nowrap">
        {raw ? String(raw) : '—'}
      </td>
    );
  }

  if (definition.type === 'select') {
    const label =
      typeof raw === 'string'
        ? definition.options?.find((o) => o.value === raw)?.label || raw
        : '—';
    return (
      <td className="py-3 px-4 text-xs font-medium text-text-primary">
        {label || '—'}
      </td>
    );
  }

  const display = Array.isArray(raw)
    ? raw.join(', ') || '—'
    : raw !== undefined && raw !== null && raw !== ''
      ? String(raw)
      : '—';

  return (
    <td
      className={`py-3 px-4 text-xs text-text-primary ${
        definition.type === 'date' ? 'font-mono tabular-nums' : ''
      }`}
    >
      {display}
    </td>
  );
};
