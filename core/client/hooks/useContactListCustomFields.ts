import { useCallback, useEffect, useMemo, useState } from 'react';
import { TenantFieldDefinition, useTenantRuntime } from '../providers/TenantRuntimeContext';

export interface ContactCustomFieldSummary {
  values: Record<string, unknown>;
  redactedFlags: Record<string, { redacted: boolean; hasValue: boolean }>;
}

const SYNC_EVENT = 'cb360:contact-cf-updated';

export const useContactListCustomFields = (contactIds: readonly string[]) => {
  const { tenantId, contactFieldDefs } = useTenantRuntime();
  const [definitions, setDefinitions] = useState<TenantFieldDefinition[]>(contactFieldDefs);
  const [records, setRecords] = useState<Record<string, ContactCustomFieldSummary>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const idsKey = useMemo(() => contactIds.filter((id) => id && id !== 'EMPTY').join(','), [contactIds]);

  const loadBatch = useCallback(async () => {
    if (!idsKey) {
      setRecords({});
      setDefinitions(contactFieldDefs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/custom-fields?ids=${encodeURIComponent(idsKey)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.definitions) && data.definitions.length > 0) {
          setDefinitions(data.definitions);
        } else {
          setDefinitions(contactFieldDefs);
        }
        setRecords(data.records || {});
        setLoading(false);
        return;
      }
    } catch {
      // Offline / Vite standalone fallback
    }
    setDefinitions(contactFieldDefs);
    setLoading(false);
  }, [idsKey, contactFieldDefs]);

  useEffect(() => {
    void loadBatch();
  }, [loadBatch, tenantId]);

  useEffect(() => {
    const onSync = () => void loadBatch();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [loadBatch]);

  return {
    definitions: definitions.length > 0 ? definitions : contactFieldDefs,
    records,
    loading,
    reload: loadBatch,
  };
};
