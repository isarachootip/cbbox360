import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100 or higher
  max?: number;
  color?: 'brand' | 'warning' | 'danger' | 'success';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'brand',
  height = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const colorClasses = {
    brand: 'bg-brand',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    success: 'bg-emerald-500',
  };

  return (
    <div className={`w-full bg-divider rounded-full overflow-hidden ${heightClasses[height]} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
