export type ExpiryStatus = 'expired' | 'expiring_soon' | 'valid' | 'unknown';

export const EXPIRY_WARNING_DAYS = 60;
const MS_PER_DAY = 86_400_000;

/** Whole days from `today` (local calendar date) until an ISO `YYYY-MM-DD` date. */
export const daysUntil = (isoDate: string, today: Date): number => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / MS_PER_DAY);
};

export const getExpiryStatus = (
  isoDate: string | undefined,
  today: Date,
  warningDays: number = EXPIRY_WARNING_DAYS
): ExpiryStatus => {
  if (!isoDate) return 'unknown';
  const days = daysUntil(isoDate, today);
  if (days < 0) return 'expired';
  if (days <= warningDays) return 'expiring_soon';
  return 'valid';
};
