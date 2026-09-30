import React from 'react';
import { TierType } from '../../types';

interface TierBadgeProps {
  tier: TierType;
  size?: 'sm' | 'md' | 'lg';
  showBorderAccent?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showBorderAccent = false,
}) => {
  const styles: Record<TierType, { text: string }> = {
    MEMBER: {
      text: 'text-slate-600',
    },
    SILVER: {
      text: 'text-slate-600',
    },
    GOLD: {
      text: 'text-amber-700',
    },
    PLATINUM: {
      text: 'text-purple-700',
    },
  };

  const sizeClasses = {
    sm: 'text-[11px] font-semibold',
    md: 'text-[12px] font-bold tracking-wide',
    lg: 'text-[13px] font-bold tracking-wider',
  };

  const config = styles[tier] || styles.MEMBER;

  return (
    <span
      className={`inline-flex items-center justify-center uppercase font-mono ${config.text} ${sizeClasses[size]}`}
    >
      {tier}
    </span>
  );
};
