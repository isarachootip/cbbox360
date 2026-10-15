import { BusinessTemplateId } from '../../types';
import { IndustryKind, IndustryProfile } from '../../types/industryProfile';

const KIND_BY_TEMPLATE: Record<BusinessTemplateId, IndustryKind | null> = {
  hospital: 'hospital',
  auto_service: 'auto_service',
  logistics: 'logistics',
  b2b_wholesale: null,
};

export const templateToIndustryKind = (templateId: BusinessTemplateId): IndustryKind | null =>
  KIND_BY_TEMPLATE[templateId];

interface VariableOptions {
  vehicleId?: string;
}

/**
 * Builds canned-response variables (e.g. {hn_number}, {license_plate}) from a real profile.
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
  }
  return vars;
};
