import React from 'react';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import {
  INDUSTRY_PANEL_LABELS,
  INDUSTRY_PANEL_RENDERERS,
} from '../../../../modules/industry-profiles/panelRegistry';

export const INDUSTRY_TAB_LABELS = INDUSTRY_PANEL_LABELS;

/**
 * Renders the registered module panel for the active profile kind via declarative lookup (zero switch/if).
 */
export const IndustryProfileTab: React.FC<{ industry: UseIndustryProfileResult }> = ({ industry }) => {
  const { kind, error, isLoading } = industry;

  if (!kind) return null;
  if (isLoading) return <p className="text-xs text-text-muted py-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (error) return <p className="text-xs text-red-600 py-6 text-center">{error}</p>;

  const renderer = INDUSTRY_PANEL_RENDERERS[kind];
  return renderer ? <>{renderer(industry)}</> : null;
};
