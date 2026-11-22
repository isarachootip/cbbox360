import { BusinessTemplateId } from '../../src/types';
import {
  AutoServiceProfile,
  ContactCenterProfile,
  ContactCenterSlaTier,
  HospitalProfile,
  IndustryKind,
  IndustryProfile,
  LogisticsProfile,
} from '../../src/types/industryProfile';

export const KIND_BY_TEMPLATE_MAP: Record<BusinessTemplateId, IndustryKind | null> = {
  contact_center: 'contact_center',
  support_fix: null,
  hospital: 'hospital',
  auto_service: 'auto_service',
  logistics: 'logistics',
  b2b_wholesale: null,
};

const SLA_TIER_LABELS: Record<ContactCenterSlaTier, { tier: string; target: string }> = {
  vip: { tier: 'VIP (1 ชม.)', target: 'ภายใน 1 ชั่วโมง' },
  priority: { tier: 'Priority (4 ชม.)', target: 'ภายใน 4 ชั่วโมง' },
  standard: { tier: 'Standard (24 ชม.)', target: 'ภายใน 24 ชั่วโมง' },
};

export interface VariableExtractOptions {
  vehicleId?: string;
  ticketId?: string;
}

type ProfileExtractor<T extends IndustryProfile> = (
  profile: T,
  options: VariableExtractOptions
) => Record<string, string>;

const extractHospital: ProfileExtractor<HospitalProfile> = (profile) => {
  const vars: Record<string, string> = { hn_number: profile.hn };
  if (profile.preferredDoctor) vars.doctor_name = profile.preferredDoctor;
  return vars;
};

const extractAutoService: ProfileExtractor<AutoServiceProfile> = (profile, options): Record<string, string> => {
  const vehicle = profile.vehicles.find((v) => v.id === options.vehicleId) ?? profile.vehicles[0];
  if (!vehicle) return {};
  return {
    license_plate: `${vehicle.licensePlate} ${vehicle.province}`,
    mileage_km: `${vehicle.currentMileageKm.toLocaleString('en-US')} กม.`,
  };
};

const extractLogistics: ProfileExtractor<LogisticsProfile> = (profile): Record<string, string> => {
  const vars: Record<string, string> = {};
  if (profile.recentTrackingNumbers[0]) vars.tracking_no = profile.recentTrackingNumbers[0];
  return vars;
};

const extractContactCenter: ProfileExtractor<ContactCenterProfile> = (profile, options) => {
  const slaMeta = SLA_TIER_LABELS[profile.slaTier];
  const vars: Record<string, string> = {
    sla_tier: slaMeta.tier,
    sla_time: slaMeta.target,
    assigned_team: profile.assignedQueue,
  };
  if (profile.contractRef) vars.contract_ref = profile.contractRef;
  if (options.ticketId) vars.ticket_id = options.ticketId;
  return vars;
};

export const INDUSTRY_VARIABLE_ADAPTERS: {
  [K in IndustryKind]: ProfileExtractor<Extract<IndustryProfile, { kind: K }>>;
} = {
  hospital: extractHospital,
  auto_service: extractAutoService,
  logistics: extractLogistics,
  contact_center: extractContactCenter,
};
