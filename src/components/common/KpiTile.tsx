import React from 'react';

interface KpiTileProps {
  label: string;
  value: string | number;
  subValue?: string | React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'highlight';
  rightElement?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  subValue,
  variant = 'default',
  rightElement,
  className = '',
  onClick,
}) => {
  const variantStyles = {
    default: 'bg-white border-border text-text-primary',
    highlight: 'bg-white border-brand/25 text-text-primary',
    warning: 'bg-white border-border text-text-primary',
    danger: 'bg-white border-rose-200/80 text-text-primary',
    success: 'bg-white border-border text-text-primary',
  };

  const valueColors = {
    default: 'text-text-primary',
    highlight: 'text-brand-deep',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    success: 'text-emerald-600',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-card border p-4 flex flex-col justify-between shadow-card transition-all ${
        variantStyles[variant]
      } ${onClick ? 'cursor-pointer hover:border-brand/40 hover:shadow-md' : ''} ${className}`}
    >
      <div className="flex items-center justify-between text-[13px] text-text-secondary font-medium">
        <span>{label}</span>
        {rightElement}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${valueColors[variant]}`}
        >
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-normal text-text-secondary">{subValue}</span>
        )}
      </div>
    </div>
  );
};
