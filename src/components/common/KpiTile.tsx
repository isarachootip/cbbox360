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
    highlight: 'bg-bg-subtle border-border text-text-primary',
    warning: 'bg-warn-bg border-warn-border text-warn-text',
    danger: 'bg-danger-bg border-danger-border text-danger-text',
    success: 'bg-success-bg border-emerald-200 text-success-text',
  };

  const valueColors = {
    default: 'text-text-primary',
    highlight: 'text-brand-deep',
    warning: 'text-warn-text',
    danger: 'text-danger-text',
    success: 'text-success-text',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-card border p-4 flex flex-col justify-between transition-all ${
        variantStyles[variant]
      } ${onClick ? 'cursor-pointer hover:shadow-sm' : ''} ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
        <span>{label}</span>
        {rightElement}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight font-mono ${valueColors[variant]}`}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-normal opacity-90 text-text-secondary">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
