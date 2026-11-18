import React, { useState } from 'react';
import { TenantFieldDefinition } from '../providers/TenantRuntimeContext';
import { DynamicFieldInput } from './DynamicFieldInput';

interface DynamicFieldSectionProps {
  definitions: TenantFieldDefinition[];
  values: Record<string, unknown>;
  redactedFlags?: Record<string, { redacted: boolean; hasValue: boolean }>;
  canEditField?: (def: TenantFieldDefinition) => boolean;
  onSave?: (nextValues: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Industry-agnostic Custom Field viewer & editor driven purely by `field_definitions`.
 * Follows CB360 Clean UI guidelines (dot indicators + colored text, zero colored pill boxes).
 */
export const DynamicFieldSection: React.FC<DynamicFieldSectionProps> = ({
  definitions,
  values,
  redactedFlags = {},
  canEditField = () => true,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(values);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (definitions.length === 0) {
    return (
      <p className="text-xs text-text-muted py-4 text-center">
        ยังไม่มีฟิลด์เพิ่มเติมสำหรับองค์กรนี้
      </p>
    );
  }

  const handleStartEdit = () => {
    setDraft({ ...values });
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    const res = await onSave(draft);
    if (!res.ok) {
      setErrorMsg(res.error || 'บันทึกข้อมูลไม่สำเร็จ');
      return;
    }
    setErrorMsg(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-divider pb-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>ข้อมูลเพิ่มเติมตามโครงสร้างองค์กร</span>
        </span>
        {onSave && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            แก้ไขข้อมูล
          </button>
        )}
      </div>

      {errorMsg && <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {definitions.map((def) => (
            <div key={def.key} className="space-y-1">
              {def.type !== 'boolean' && (
                <label className="block text-xs font-semibold text-text-secondary">
                  {def.label} {def.validation?.required ? '*' : ''}
                </label>
              )}
              <DynamicFieldInput
                definition={def}
                value={draft[def.key]}
                disabled={!canEditField(def)}
                onChange={(v) => setDraft((prev) => ({ ...prev, [def.key]: v }))}
              />
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-subtle"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover"
            >
              บันทึก
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {definitions.map((def) => {
            const raw = values[def.key];
            const isRedacted = Boolean(redactedFlags[def.key]?.redacted);
            const display = isRedacted
              ? 'จำกัดสิทธิ์การเข้าถึง (PDPA)'
              : Array.isArray(raw)
                ? raw.join(', ') || '—'
                : raw !== undefined && raw !== ''
                  ? String(raw)
                  : '—';

            return (
              <div key={def.key} className="p-3 rounded-xl bg-bg-subtle border border-border/80">
                <div className="text-[11px] text-text-secondary">{def.label}</div>
                <div
                  className={`text-xs font-semibold mt-0.5 ${
                    isRedacted ? 'text-amber-600' : 'text-text-primary'
                  }`}
                >
                  {display}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
