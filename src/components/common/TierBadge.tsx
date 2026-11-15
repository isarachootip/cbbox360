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
    sm: 'text-2xs font-semibold tracking-[0.02em]',
    md: 'text-xs font-semibold tracking-[0.03em]',
    lg: 'text-ui font-semibold tracking-[0.04em]',
  };

  const config = styles[tier] || styles.MEMBER;

  return (
    <span
      className={`inline-flex items-center justify-center uppercase ${config.text} ${sizeClasses[size]}`}
    >
      {tier}
    </span>
  );
};
