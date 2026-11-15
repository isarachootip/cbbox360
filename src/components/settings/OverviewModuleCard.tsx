import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface ModuleRow {
  label: string;
  value: React.ReactNode;
}

export interface ModuleCardConfig {
  key: string;
  icon: React.ReactNode;
  iconBgClass: string;
  headerRight: React.ReactNode;
  title: string;
  description: React.ReactNode;
  rows: ModuleRow[];
  ctaLabel: string;
  onAction: () => void;
}

export const OverviewModuleCard: React.FC<{ card: ModuleCardConfig }> = ({ card }) => (
  <div className="bg-white rounded-card border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBgClass}`}>
          {card.icon}
        </div>
        {card.headerRight}
      </div>
      <h3 className="font-semibold text-sm text-text-primary mb-1">{card.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-4">{card.description}</p>
      <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
        {card.rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <span>{row.label}</span>
            {row.value}
          </div>
        ))}
      </div>
    </div>
    <button
      type="button"
      onClick={card.onAction}
      className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-semibold border border-border flex items-center justify-center gap-1 transition-all cursor-pointer"
    >
      <span>{card.ctaLabel}</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  </div>
);
