import React from 'react';
import { ChannelType } from '../../types';

interface ChannelChipProps {
  channel: ChannelType | string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const ChannelChip: React.FC<ChannelChipProps> = ({
  channel,
  showDot = false,
  size = 'sm',
}) => {
  const getStyle = (ch: string) => {
    switch (ch.toLowerCase()) {
      case 'line':
        return { bg: 'bg-[#E3F7EA]', text: 'text-[#0B6B34]', dot: 'bg-[#06A94A]' };
      case 'facebook':
      case 'fb lead ads':
        return { bg: 'bg-[#E6EEFF]', text: 'text-[#1146A8]', dot: 'bg-[#0866FF]' };
      case '3cx':
      case 'สายโทร 3cx':
        return { bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', dot: 'bg-[#9333EA]' };
      case 'web form':
      case 'web':
        return { bg: 'bg-[#E0F2FE]', text: 'text-[#0E7490]', dot: 'bg-[#0284C7]' };
      case 'sales rep':
        return { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
    }
  };

  const style = getStyle(channel);
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${style.bg} ${style.text} ${sizeClass}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {channel}
    </span>
  );
};
