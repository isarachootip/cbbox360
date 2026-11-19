import React from 'react';
import { TenantFieldDefinition } from '../../../core/client/providers/TenantRuntimeContext';
import { DynamicFieldInput } from '../../../core/client/custom-fields/DynamicFieldInput';

interface ModalCustomFieldsSectionProps {
  contactLabel: string;
  definitions: TenantFieldDefinition[];
  values: Record<string, unknown>;
  redactedFlags?: Record<string, { redacted: boolean; hasValue: boolean }>;
  canEditField?: (def: TenantFieldDefinition) => boolean;
  onChange: (key: string, val: unknown) => void;
}

export const ModalCustomFieldsSection: React.FC<ModalCustomFieldsSectionProps> = ({
  contactLabel,
  definitions,
  values,
  redactedFlags = {},
  canEditField = () => true,
  onChange,
}) => {
  if (definitions.length === 0) return null;

  return (
    <div className="pt-3 border-t border-divider space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
        <span>ข้อมูลเฉพาะของ{contactLabel}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {definitions.map((def) => {
          const isRedacted = Boolean(redactedFlags[def.key]?.redacted);
          const disabled = isRedacted || !canEditField(def);
          return (
            <div key={def.key} className="space-y-1">
              <label className="block text-xs font-semibold text-text-secondary">
                {def.label} {def.validation?.required ? <span className="text-rose-500">*</span> : null}
              </label>
              {isRedacted ? (
                <div className="px-3 py-2 text-xs font-medium text-amber-600 bg-bg-subtle border border-border rounded-lg">
                  จำกัดสิทธิ์การเข้าถึง (PDPA ม.26)
                </div>
              ) : (
                <DynamicFieldInput
                  definition={def}
                  value={values[def.key]}
                  disabled={disabled}
                  onChange={(v) => onChange(def.key, v)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
