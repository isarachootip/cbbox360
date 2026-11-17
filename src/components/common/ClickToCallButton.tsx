import React from 'react';
import { PhoneOutgoing } from 'lucide-react';
import { useClickToCall } from '../../hooks/useClickToCall';

interface ClickToCallButtonProps {
  phone: string;
  fullPhone?: string;
  customerId?: string;
  customerName?: string;
  matchedContactName?: string;
  variant?: 'inline' | 'button' | 'icon';
  label?: string;
  className?: string;
}

export const ClickToCallButton: React.FC<ClickToCallButtonProps> = ({
  phone,
  fullPhone,
  customerId,
  customerName,
  matchedContactName,
  variant = 'inline',
  label,
  className = '',
}) => {
  const { pbxConfig, triggerClickToCall } = useClickToCall();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerClickToCall({
      rawPhone: phone,
      fullPhone,
      customerId,
      customerName,
      matchedContactName,
    });
  };

  if (!pbxConfig.enabled) {
    return variant === 'inline' ? (
      <span className={`font-mono tabular-nums ${className}`}>{phone}</span>
    ) : null;
  }

  const titleText = `กดเพื่อโทรออก ${fullPhone || phone} ผ่าน PABX WebPhone`;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={titleText}
        className={`p-1.5 rounded-lg text-brand hover:text-brand-hover hover:bg-brand-tint transition-colors cursor-pointer inline-flex items-center justify-center ${className}`}
      >
        <PhoneOutgoing className="w-3.5 h-3.5" />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={titleText}
        className={`px-2.5 py-1 border border-border hover:border-brand/50 hover:bg-bg-subtle rounded-lg text-[11px] font-semibold text-brand inline-flex items-center gap-1 cursor-pointer transition-colors ${className}`}
      >
        <PhoneOutgoing className="w-3 h-3 shrink-0" />
        <span>{label || 'โทรออก'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={titleText}
      className={`group/call inline-flex items-center gap-1.5 font-mono tabular-nums text-brand hover:text-brand-hover hover:underline font-medium cursor-pointer transition-colors ${className}`}
    >
      <span>{label || phone}</span>
      <PhoneOutgoing className="w-3 h-3 opacity-75 group-hover/call:opacity-100 shrink-0" />
    </button>
  );
};
