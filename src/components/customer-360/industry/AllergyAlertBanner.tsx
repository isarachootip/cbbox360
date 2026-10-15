import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { IndustryProfile, RedactedHospitalProfile } from '../../../types/industryProfile';
import { hasDrugAllergy } from '../../../domain/industry/hospitalRules';

interface AllergyAlertBannerProps {
  profile: IndustryProfile | null;
  /** Roles without medical access only learn that an allergy exists, not which drug. */
  redacted?: RedactedHospitalProfile | null;
  className?: string;
}

/** Shown at the top of Customer 360 so drug allergies are visible before any interaction. */
export const AllergyAlertBanner: React.FC<AllergyAlertBannerProps> = ({ profile, redacted, className = '' }) => {
  const full = profile?.kind === 'hospital' && hasDrugAllergy(profile) ? profile : null;
  const flagged = redacted?.hasDrugAllergy ? redacted : null;
  if (!full && !flagged) return null;

  return (
    <div
      role="alert"
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-300 border-l-4 border-l-red-500 bg-white ${className}`}
    >
      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-xs font-bold text-red-600">แพ้ยา:</span>
      <span className="text-xs font-semibold text-text-primary">
        {full ? full.drugAllergies.join(', ') : 'มีข้อมูลแพ้ยา (ติดต่อแพทย์/พยาบาลเพื่อดูรายละเอียด)'}
      </span>
      <span className="ml-auto text-[11px] text-text-muted">HN {full?.hn ?? flagged?.hn}</span>
    </div>
  );
};
