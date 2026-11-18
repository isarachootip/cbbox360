import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface DeclarativeAlertItem {
  fieldKey: string;
  severity: 'info' | 'warning' | 'danger';
  prefix: string;
  text: string;
  redacted?: boolean;
}

interface SensitivityAlertBannerProps {
  banners: DeclarativeAlertItem[];
  className?: string;
}

const SEVERITY_STYLES: Record<DeclarativeAlertItem['severity'], { border: string; accent: string }> = {
  danger: { border: 'border-rose-300 border-l-rose-500', accent: 'text-rose-600' },
  warning: { border: 'border-amber-300 border-l-amber-500', accent: 'text-amber-600' },
  info: { border: 'border-blue-300 border-l-blue-500', accent: 'text-blue-600' },
};

/**
 * Generic config-driven alert banner rendered from `field_definitions.ui.alertBanner`.
 * Replaces the hospital-specific `<AllergyAlertBanner />` without referencing any industry in Core.
 */
export const SensitivityAlertBanner: React.FC<SensitivityAlertBannerProps> = ({
  banners,
  className = '',
}) => {
  if (!banners || banners.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {banners.map((b) => {
        const style = SEVERITY_STYLES[b.severity] || SEVERITY_STYLES.warning;
        return (
          <div
            key={b.fieldKey}
            role="alert"
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-l-4 bg-white ${style.border}`}
          >
            <ShieldAlert className={`w-4 h-4 shrink-0 ${style.accent}`} />
            <span className={`text-xs font-bold ${style.accent}`}>{b.prefix}</span>
            <span className="text-xs font-semibold text-text-primary">{b.text}</span>
          </div>
        );
      })}
    </div>
  );
};
