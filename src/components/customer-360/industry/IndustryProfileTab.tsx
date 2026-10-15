import React from 'react';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { HospitalProfilePanel } from './HospitalProfilePanel';
import { VehicleList } from './VehicleList';
import { LogisticsProfilePanel } from './LogisticsProfilePanel';

export const INDUSTRY_TAB_LABELS = {
  hospital: 'ข้อมูลผู้ป่วย',
  auto_service: 'รถของลูกค้า',
  logistics: 'บัญชีผู้ส่ง',
} as const;

/** Renders the profile panel for the tenant's active industry template. */
export const IndustryProfileTab: React.FC<{ industry: UseIndustryProfileResult }> = ({ industry }) => {
  const { kind, profile, isLoading, save } = industry;

  if (!kind) return null;
  if (isLoading) return <p className="text-xs text-text-muted py-6 text-center">กำลังโหลดข้อมูล...</p>;

  switch (kind) {
    case 'hospital':
      return <HospitalProfilePanel profile={profile?.kind === 'hospital' ? profile : null} onSave={save} />;
    case 'auto_service':
      return <VehicleList profile={profile?.kind === 'auto_service' ? profile : null} onSave={save} />;
    case 'logistics':
      return <LogisticsProfilePanel profile={profile?.kind === 'logistics' ? profile : null} onSave={save} />;
  }
};
