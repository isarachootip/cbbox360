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
  const styles: Record<TierType, { text: string; bg: string; border?: string }> = {
    MEMBER: {
      text: 'text-[#4A5058]',
      bg: 'bg-[#EEF1F5]',
      border: 'border-[#9AA3AD]',
    },
    SILVER: {
      text: 'text-[#4A5058]',
      bg: 'bg-[#ECEEF0]',
      border: 'border-[#8C959F]',
    },
    GOLD: {
      text: 'text-[#7A4F00]',
      bg: 'bg-[#FBEBC8]',
      border: 'border-[#C9962E]',
    },
    PLATINUM: {
      text: 'text-[#4A3F8C]',
      bg: 'bg-[#E9E7F5]',
      border: 'border-[#6A5CB8]',
    },
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded',
    md: 'text-[12px] px-2.5 py-0.5 rounded font-semibold tracking-wide',
    lg: 'text-[13px] px-3 py-1 rounded-md font-bold tracking-wider',
  };

  const config = styles[tier] || styles.MEMBER;

  return (
    <span
      className={`inline-flex items-center justify-center uppercase font-mono ${config.bg} ${config.text} ${sizeClasses[size]} ${
        showBorderAccent ? `border-t-2 ${config.border}` : ''
      }`}
    >
      {tier}
    </span>
  );
};
