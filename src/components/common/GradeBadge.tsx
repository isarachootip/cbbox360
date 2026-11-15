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

  const sizeClass = size === 'sm' ? 'text-2xs' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${config.text} ${sizeClass}`}
    >
      {prefix && <span className="font-normal text-2xs opacity-80">{prefix}</span>}
      <span className="font-semibold tabular-nums">{grade}</span>
    </span>
  );
};
