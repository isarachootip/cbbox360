import { CreditAccount } from '../../types';

export interface AgingBucketSummary {
  label: string;
  amount: string;
  width: string;
  color: string;
}

export interface CreditPortfolioSummary {
  totalReceivablesText: string;
  overdueText: string;
  overduePercentText: string;
  dsoText: string;
  riskCustomerCountText: string;
  buckets: AgingBucketSummary[];
}

const DEFAULT_WHOLESALE_SUMMARY: CreditPortfolioSummary = {
  totalReceivablesText: '฿18.60M',
  overdueText: '฿3.20M',
  overduePercentText: '(17%)',
  dsoText: '41 วัน',
  riskCustomerCountText: '58 ราย',
  buckets: [
    { label: 'ยังไม่ครบกำหนด', amount: '฿15.40M', width: '82.8%', color: 'bg-[#3B82F6]' },
    { label: '1–30 วัน', amount: '฿1.90M', width: '10.2%', color: 'bg-[#06B6D4]' },
    { label: '31–60 วัน', amount: '฿0.70M', width: '3.8%', color: 'bg-[#F59E0B]' },
    { label: '61–90 วัน', amount: '฿0.35M', width: '1.9%', color: 'bg-[#EA580C]' },
    { label: '90+ วัน', amount: '฿0.25M', width: '1.3%', color: 'bg-[#E11D48]' },
  ],
};

const formatBahtCompact = (amount: number): string => {
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(2)}M`;
  return `฿${amount.toLocaleString('en-US')}`;
};

export const computeCreditPortfolioSummary = (
  accounts: CreditAccount[],
  isDefaultTenant: boolean
): CreditPortfolioSummary => {
  if (isDefaultTenant) return DEFAULT_WHOLESALE_SUMMARY;

  const totalUsed = accounts.reduce((sum, a) => sum + a.used, 0);
  const totalOverdue = accounts.reduce((sum, a) => sum + a.overdueAmount, 0);
  const currentAmt = Math.max(0, totalUsed - totalOverdue);
  const d1_30 = accounts.filter((a) => a.aging === '1–30 วัน').reduce((s, a) => s + a.overdueAmount, 0);
  const d31_60 = accounts.filter((a) => a.aging === '31–60 วัน').reduce((s, a) => s + a.overdueAmount, 0);
  const d61_90 = accounts.filter((a) => a.aging === '61–90 วัน').reduce((s, a) => s + a.overdueAmount, 0);
  const d90Plus = accounts.filter((a) => a.aging === '90+ วัน').reduce((s, a) => s + a.overdueAmount, 0);

  const denom = totalUsed > 0 ? totalUsed : 1;
  const pct = (val: number) => `${Math.max(val > 0 ? 2 : 0, Number(((val / denom) * 100).toFixed(1)))}%`;
  const overdueRatio = totalUsed > 0 ? Math.round((totalOverdue / totalUsed) * 100) : 0;
  const riskCount = accounts.filter((a) => a.grade === 'C' || a.grade === 'D').length;

  return {
    totalReceivablesText: formatBahtCompact(totalUsed),
    overdueText: formatBahtCompact(totalOverdue),
    overduePercentText: `(${overdueRatio}%)`,
    dsoText: `${accounts.some((a) => a.overdueAmount > 0) ? 28 : 15} วัน`,
    riskCustomerCountText: `${riskCount} ราย`,
    buckets: [
      { label: 'ยังไม่ครบกำหนด', amount: formatBahtCompact(currentAmt), width: pct(currentAmt), color: 'bg-[#3B82F6]' },
      { label: '1–30 วัน', amount: formatBahtCompact(d1_30), width: pct(d1_30), color: 'bg-[#06B6D4]' },
      { label: '31–60 วัน', amount: formatBahtCompact(d31_60), width: pct(d31_60), color: 'bg-[#F59E0B]' },
      { label: '61–90 วัน', amount: formatBahtCompact(d61_90), width: pct(d61_90), color: 'bg-[#EA580C]' },
      { label: '90+ วัน', amount: formatBahtCompact(d90Plus), width: pct(d90Plus), color: 'bg-[#E11D48]' },
    ],
  };
};
