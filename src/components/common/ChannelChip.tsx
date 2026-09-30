import React from 'react';
import { ChannelType } from '../../types';

interface ChannelChipProps {
  channel: ChannelType | string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const ChannelChip: React.FC<ChannelChipProps> = ({
  channel,
  showDot = true,
  size = 'sm',
}) => {
  const getStyle = (ch: string) => {
    switch (ch.toLowerCase()) {
      case 'line':
        return { text: 'text-[#0B6B34]', dot: 'bg-[#06A94A]' };
      case 'facebook':
      case 'fb lead ads':
        return { text: 'text-[#1146A8]', dot: 'bg-[#0866FF]' };
      case '3cx':
      case 'สายโทร 3cx':
        return { text: 'text-[#6B21A8]', dot: 'bg-[#9333EA]' };
      case 'web form':
      case 'web':
        return { text: 'text-[#0E7490]', dot: 'bg-[#0284C7]' };
      case 'sales rep':
        return { text: 'text-[#C2410C]', dot: 'bg-[#EA580C]' };
      default:
        return { text: 'text-gray-700', dot: 'bg-gray-400' };
    }
  };

  const style = getStyle(channel);
  const sizeClass = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${style.text} ${sizeClass}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span>{channel}</span>
    </span>
  );
};
