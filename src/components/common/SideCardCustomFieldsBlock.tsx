import React, { useState } from 'react';
import { TenantFieldDefinition } from '../../../core/client/providers/TenantRuntimeContext';
import { DynamicFieldInput } from '../../../core/client/custom-fields/DynamicFieldInput';
import {
  DeclarativeAlertItem,
  SensitivityAlertBanner,
} from '../../../core/client/custom-fields/SensitivityAlertBanner';

interface SideCardCustomFieldsBlockProps {
  contactLabel: string;
  definitions: TenantFieldDefinition[];
  values: Record<string, unknown>;
  redactedFlags: Record<string, { redacted: boolean; hasValue: boolean }>;
  banners: DeclarativeAlertItem[];
  canEditField: (def: TenantFieldDefinition) => boolean;
  onSave: (nextValues: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
}

const formatFieldValue = (def: TenantFieldDefinition, raw: unknown): string => {
  if (raw === undefined || raw === null || raw === '') return '—';
  if (def.type === 'select' && typeof raw === 'string') {
    return def.options?.find((o) => o.value === raw)?.label || raw;
  }
  if (Array.isArray(raw)) {
    return raw.length > 0 ? raw.join(', ') : 'ไม่พบประวัติ';
  }
  return String(raw);
};

export const SideCardCustomFieldsBlock: React.FC<SideCardCustomFieldsBlockProps> = ({
  contactLabel,
  definitions,
  values,
  redactedFlags,
  banners,
  canEditField,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (definitions.length === 0) return null;

  const startEditing = () => {
    setDraft({ ...values });
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    const res = await onSave(draft);
    setSaving(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'บันทึกไม่สำเร็จ');
      return;
    }
    setIsEditing(false);
  };

  return (
    <div className="py-3 border-b border-divider space-y-2.5">
      <SensitivityAlertBanner banners={banners} />

      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold text-text-muted tracking-[0.05em] uppercase">
          ข้อมูล{contactLabel}เฉพาะทาง
        </span>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            แก้ไข
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-2.5 bg-bg-subtle p-2.5 rounded-xl border border-border">
          {definitions.map((def) => {
            const isRedacted = Boolean(redactedFlags[def.key]?.redacted);
            const editable = canEditField(def) && !isRedacted;
            return (
              <div key={def.key} className="space-y-1">
                <label className="block text-[11px] font-semibold text-text-secondary">
                  {def.label} {def.validation?.required ? '*' : ''}
                </label>
                {isRedacted ? (
                  <div className="text-xs text-amber-600 font-medium">
                    จำกัดสิทธิ์ตาม PDPA ม.26
                  </div>
                ) : (
                  <DynamicFieldInput
                    definition={def}
                    value={draft[def.key]}
                    disabled={!editable}
                    onChange={(v) => setDraft((prev) => ({ ...prev, [def.key]: v }))}
                  />
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs border border-border bg-white rounded-lg hover:bg-bg-muted cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2 text-xs">
          {definitions.map((def) => {
            const isRedacted = Boolean(redactedFlags[def.key]?.redacted);
            const isUniqueCode = Boolean(def.validation?.unique);
            const formatted = formatFieldValue(def, values[def.key]);

            return (
              <div key={def.key} className="flex items-start justify-between gap-2">
                <span className="text-text-secondary shrink-0">{def.label}</span>
                {isRedacted ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 text-right">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>จำกัดสิทธิ์ (PDPA ม.26)</span>
                  </span>
                ) : (
                  <span
                    className={`font-semibold text-right break-words ${
                      isUniqueCode ? 'font-mono text-brand-deep' : 'text-text-primary'
                    }`}
                  >
                    {formatted}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
