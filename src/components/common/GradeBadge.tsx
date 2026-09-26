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
  const styles: Record<CreditGrade, { text: string; bg: string; border: string }> = {
    A: { text: 'text-[#1F6B35]', bg: 'bg-[#E3F1E6]', border: 'border-[#C1E2C8]' },
    B: { text: 'text-[#1146A8]', bg: 'bg-[#E6EEFF]', border: 'border-[#C2D6FC]' },
    C: { text: 'text-[#7A4F00]', bg: 'bg-[#FCEFD9]', border: 'border-[#F5DBB0]' },
    D: { text: 'text-[#8A2E1C]', bg: 'bg-[#F6E1DC]', border: 'border-[#EDC0B7]' },
  };

  const config = styles[grade] || styles.A;

  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-[12px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded ${config.bg} ${config.text} ${sizeClass}`}
    >
      {prefix && <span className="font-normal text-[11px] opacity-80">{prefix}</span>}
      <span className="font-bold font-mono">{grade}</span>
    </span>
  );
};
