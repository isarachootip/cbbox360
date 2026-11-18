import { useTenantRuntime } from '../providers/TenantRuntimeContext';

/**
 * Resolves tenant-specific terminology (e.g. contact.singular -> "ผู้ป่วย" | "ผู้เอาประกัน" | "ลูกค้า").
 */
export const useLabel = () => {
  const { labels, tLabel } = useTenantRuntime();
  return {
    labels,
    t: tLabel,
    contactLabel: tLabel('contact.singular', 'ลูกค้า'),
    contactPluralLabel: tLabel('contact.plural', 'รายชื่อลูกค้า'),
    caseLabel: tLabel('case.singular', 'Ticket'),
  };
};
