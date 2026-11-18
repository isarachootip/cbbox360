import React from 'react';
import type { UseIndustryProfileResult } from '../../src/hooks/useIndustryProfile';
import type { IndustryKind } from '../../src/types/industryProfile';
import { HospitalProfilePanel } from '../../src/components/customer-360/industry/HospitalProfilePanel';
import { VehicleList } from '../../src/components/customer-360/industry/VehicleList';
import { LogisticsProfilePanel } from '../../src/components/customer-360/industry/LogisticsProfilePanel';
import { ContactCenterProfilePanel } from '../../src/components/customer-360/industry/ContactCenterProfilePanel';
import { RedactedPatientNotice } from '../../src/components/customer-360/industry/RedactedPatientNotice';
import { AllergyAlertBanner } from '../../src/components/customer-360/industry/AllergyAlertBanner';

export const INDUSTRY_PANEL_LABELS: Record<IndustryKind, string> = {
  contact_center: 'ข้อมูลผู้ติดต่อ & SLA',
  hospital: 'ข้อมูลผู้ป่วย',
  auto_service: 'รถของลูกค้า',
  logistics: 'บัญชีผู้ส่ง',
};

type PanelRenderer = (industry: UseIndustryProfileResult) => React.ReactNode;

export const INDUSTRY_PANEL_RENDERERS: Record<IndustryKind, PanelRenderer> = {
  hospital: ({ profile, access, redacted, save }) =>
    access === 'redacted' ? (
      <RedactedPatientNotice redacted={redacted} />
    ) : (
      <HospitalProfilePanel
        profile={profile?.kind === 'hospital' ? profile : null}
        access={access}
        onSave={save}
      />
    ),
  auto_service: ({ profile, save }) => (
    <VehicleList profile={profile?.kind === 'auto_service' ? profile : null} onSave={save} />
  ),
  logistics: ({ profile, save }) => (
    <LogisticsProfilePanel
      profile={profile?.kind === 'logistics' ? profile : null}
      onSave={save}
    />
  ),
  contact_center: ({ profile, save }) => (
    <ContactCenterProfilePanel
      profile={profile?.kind === 'contact_center' ? profile : null}
      onSave={save}
    />
  ),
};

export const IndustryHeaderAlertBridge: React.FC<{
  industry: UseIndustryProfileResult;
  className?: string;
}> = ({ industry, className }) => (
  <AllergyAlertBanner
    profile={industry.profile}
    redacted={industry.redacted}
    className={className}
  />
);
