import { BusinessTemplateId } from '../../types';
import {
  ContactCenterSlaTier,
  IndustryKind,
  IndustryProfile,
} from '../../types/industryProfile';

const KIND_BY_TEMPLATE: Record<BusinessTemplateId, IndustryKind | null> = {
  contact_center: 'contact_center',
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

export const templateToIndustryKind = (templateId: BusinessTemplateId): IndustryKind | null =>
  KIND_BY_TEMPLATE[templateId];

interface VariableOptions {
  vehicleId?: string;
  ticketId?: string;
}

/**
 * Builds canned-response variables (e.g. {hn_number}, {license_plate}, {sla_tier}) from a real profile.
 * Only keys with a value are returned so callers can fall back to their own defaults.
 */
export const buildIndustryVariables = (
  profile: IndustryProfile | null,
  options: VariableOptions = {}
): Record<string, string> => {
  if (!profile) return {};
  const vars: Record<string, string> = {};

  switch (profile.kind) {
    case 'hospital':
      vars.hn_number = profile.hn;
      if (profile.preferredDoctor) vars.doctor_name = profile.preferredDoctor;
      break;
    case 'auto_service': {
      const vehicle =
        profile.vehicles.find((v) => v.id === options.vehicleId) ?? profile.vehicles[0];
      if (vehicle) {
        vars.license_plate = `${vehicle.licensePlate} ${vehicle.province}`;
        vars.mileage_km = `${vehicle.currentMileageKm.toLocaleString('en-US')} กม.`;
      }
      break;
    }
    case 'logistics':
      if (profile.recentTrackingNumbers[0]) vars.tracking_no = profile.recentTrackingNumbers[0];
      break;
    case 'contact_center': {
      const slaMeta = SLA_TIER_LABELS[profile.slaTier];
      vars.sla_tier = slaMeta.tier;
      vars.sla_time = slaMeta.target;
      vars.assigned_team = profile.assignedQueue;
      if (profile.contractRef) vars.contract_ref = profile.contractRef;
      if (options.ticketId) vars.ticket_id = options.ticketId;
      break;
    }
  }
  return vars;
};
