import React from 'react';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { HospitalProfilePanel } from './HospitalProfilePanel';
import { VehicleList } from './VehicleList';
import { LogisticsProfilePanel } from './LogisticsProfilePanel';
import { ContactCenterProfilePanel } from './ContactCenterProfilePanel';
import { RedactedPatientNotice } from './RedactedPatientNotice';

export const INDUSTRY_TAB_LABELS = {
  contact_center: 'ข้อมูลผู้ติดต่อ & SLA',
  hospital: 'ข้อมูลผู้ป่วย',
  auto_service: 'รถของลูกค้า',
  logistics: 'บัญชีผู้ส่ง',
} as const;

/** Renders the profile panel for the tenant's active industry template. */
export const IndustryProfileTab: React.FC<{ industry: UseIndustryProfileResult }> = ({ industry }) => {
  const { kind, profile, access, redacted, error, isLoading, save } = industry;

  if (!kind) return null;
  if (isLoading) return <p className="text-xs text-text-muted py-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (error) return <p className="text-xs text-red-600 py-6 text-center">{error}</p>;

  switch (kind) {
    case 'hospital':
      if (access === 'redacted') return <RedactedPatientNotice redacted={redacted} />;
      return (
        <HospitalProfilePanel
          profile={profile?.kind === 'hospital' ? profile : null}
          access={access}
          onSave={save}
        />
      );
    case 'auto_service':
      return <VehicleList profile={profile?.kind === 'auto_service' ? profile : null} onSave={save} />;
    case 'logistics':
      return <LogisticsProfilePanel profile={profile?.kind === 'logistics' ? profile : null} onSave={save} />;
    case 'contact_center':
      return (
        <ContactCenterProfilePanel
          profile={profile?.kind === 'contact_center' ? profile : null}
          onSave={save}
        />
      );
  }
};
