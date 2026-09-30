import React from 'react';
import { CreditGrade } from '../../types';

interface GradeBadgeProps {
  grade: CreditGrade;
  prefix?: string;
  size?: 'sm' | 'md';
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  prefix = 'Credit',
  size = 'md',
}) => {
  const styles: Record<CreditGrade, { text: string }> = {
    A: { text: 'text-emerald-700' },
    B: { text: 'text-blue-700' },
    C: { text: 'text-amber-700' },
    D: { text: 'text-rose-700' },
  };

  const config = styles[grade] || styles.A;

  const sizeClass = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${config.text} ${sizeClass}`}
    >
      {prefix && <span className="font-normal text-[11px] opacity-80">{prefix}</span>}
      <span className="font-bold font-mono">{grade}</span>
    </span>
  );
};
