import React from 'react';
import { TenantFieldDefinition } from '../providers/TenantRuntimeContext';

interface DynamicFieldInputProps {
  definition: TenantFieldDefinition;
  value: unknown;
  disabled?: boolean;
  onChange: (nextValue: unknown) => void;
}

export const DynamicFieldInput: React.FC<DynamicFieldInputProps> = ({
  definition,
  value,
  disabled = false,
  onChange,
}) => {
  const baseClass =
    'w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-brand disabled:bg-bg-subtle disabled:text-text-muted';

  if (definition.type === 'boolean') {
    return (
      <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-border text-brand focus:ring-brand"
        />
        <span>{definition.label}</span>
      </label>
    );
  }

  if (definition.type === 'select') {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="">-- เลือก {definition.label} --</option>
        {(definition.options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (definition.type === 'tags' || definition.type === 'multiselect') {
    const joined = Array.isArray(value) ? value.join(', ') : '';
    return (
      <input
        type="text"
        value={joined}
        disabled={disabled}
        placeholder="คั่นแต่ละรายการด้วยเครื่องหมายจุลภาค (,)"
        onChange={(e) => {
          const items = e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(items);
        }}
        className={baseClass}
      />
    );
  }

  if (definition.type === 'textarea') {
    return (
      <textarea
        rows={3}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      />
    );
  }

  if (definition.type === 'number' || definition.type === 'currency') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${baseClass} font-mono tabular-nums`}
      />
    );
  }

  return (
    <input
      type={definition.type === 'date' ? 'date' : definition.type === 'email' ? 'email' : 'text'}
      value={typeof value === 'string' ? value : ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
    />
  );
};
