import React from 'react';
import { UserRole } from '../../types';

interface RoleBadgeProps {
  role: UserRole | string;
  label?: string;
  showDot?: boolean;
  className?: string;
  textSize?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  label,
  showDot = false,
  className = '',
  textSize = 'text-xs',
}) => {
  const getRoleConfig = (r: string) => {
    switch (r) {
      case 'sysadmin':
        return { text: 'text-purple-700', dot: 'bg-purple-600', label: 'sysadmin' };
      case 'admin':
        return { text: 'text-blue-700', dot: 'bg-blue-600', label: 'admin' };
      case 'SF_1':
        return { text: 'text-emerald-700', dot: 'bg-emerald-600', label: 'SF_1 (Sales)' };
      case 'SF_2':
        return { text: 'text-cyan-700', dot: 'bg-cyan-600', label: 'SF_2 (Service)' };
      case 'SF_3':
        return { text: 'text-amber-700', dot: 'bg-amber-600', label: 'SF_3 (Credit)' };
      case 'supervisor':
        return { text: 'text-indigo-700', dot: 'bg-indigo-600', label: 'supervisor' };
      default:
        return { text: 'text-slate-700', dot: 'bg-slate-500', label: r };
    }
  };

  const config = getRoleConfig(role);
  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold ${config.text} ${textSize} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />}
      <span>{displayLabel}</span>
    </span>
  );
};
