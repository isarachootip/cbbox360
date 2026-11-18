import { useCallback, useEffect, useState } from 'react';
import { TenantFieldDefinition, useTenantRuntime } from '../providers/TenantRuntimeContext';
import { DeclarativeAlertItem } from '../custom-fields/SensitivityAlertBanner';

interface ContactCustomFieldsState {
  definitions: TenantFieldDefinition[];
  values: Record<string, unknown>;
  redactedFlags: Record<string, { redacted: boolean; hasValue: boolean }>;
  banners: DeclarativeAlertItem[];
  loading: boolean;
}

const SYNC_EVENT = 'cb360:contact-cf-updated';

export const useContactCustomFields = (contactId: string) => {
  const { tenantId, contactFieldDefs, hasPermission } = useTenantRuntime();
  const [state, setState] = useState<ContactCustomFieldsState>({
    definitions: contactFieldDefs,
    values: {},
    redactedFlags: {},
    banners: [],
    loading: false,
  });

  const loadFields = useCallback(async () => {
    if (!contactId) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(contactId)}/custom-fields`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setState({
          definitions: Array.isArray(data.definitions) ? data.definitions : contactFieldDefs,
          values: data.values || {},
          redactedFlags: data.redactedFlags || {},
          banners: Array.isArray(data.banners) ? data.banners : [],
          loading: false,
        });
        return;
      }
    } catch {
      // Offline / Vite standalone fallback
    }
    setState((prev) => ({ ...prev, definitions: contactFieldDefs, loading: false }));
  }, [contactId, contactFieldDefs]);

  useEffect(() => {
    void loadFields();
  }, [loadFields, tenantId]);

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ contactId?: string }>).detail;
      if (!detail?.contactId || detail.contactId === contactId) {
        void loadFields();
      }
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [contactId, loadFields]);

  const canEditField = useCallback(
    (def: TenantFieldDefinition): boolean => {
      const editPerm =
        def.acl?.editPerm ||
        (def.sensitivity === 'pdpa_s26' ? 'contact.pdpa_s26:write' : 'contact:write');
      if (hasPermission(editPerm)) return true;
      if (def.sensitivity === 'pdpa_s26' && hasPermission('contact.pdpa_s26:write')) return true;
      return false;
    },
    [hasPermission]
  );

  const saveValues = useCallback(
    async (nextValues: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/contacts/${encodeURIComponent(contactId)}/custom-fields`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: nextValues }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const msg =
            Array.isArray(data.errors) && data.errors[0]?.message
              ? data.errors[0].message
              : data.error === 'FORBIDDEN_CUSTOM_FIELDS'
                ? 'คุณไม่มีสิทธิ์แก้ไขข้อมูลที่มีความอ่อนไหวสูง (PDPA ม.26)'
                : data.error || 'บันทึกข้อมูลไม่สำเร็จ';
          return { ok: false, error: msg };
        }
        await loadFields();
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { contactId } }));
        return { ok: true };
      } catch {
        return { ok: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้' };
      }
    },
    [contactId, loadFields]
  );

  return {
    ...state,
    definitions: state.definitions.length > 0 ? state.definitions : contactFieldDefs,
    canEditField,
    saveValues,
    reloadFields: loadFields,
  };
};
