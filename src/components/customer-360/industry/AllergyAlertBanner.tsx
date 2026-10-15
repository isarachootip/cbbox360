import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { IndustryProfile } from '../../../types/industryProfile';
import { hasDrugAllergy } from '../../../domain/industry/hospitalRules';

/** Shown at the top of Customer 360 so drug allergies are visible before any interaction. */
export const AllergyAlertBanner: React.FC<{ profile: IndustryProfile | null; className?: string }> = ({
  profile,
  className = '',
}) => {
  if (!profile || profile.kind !== 'hospital' || !hasDrugAllergy(profile)) return null;
  return (
    <div
      role="alert"
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-300 border-l-4 border-l-red-500 bg-white ${className}`}
    >
      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-xs font-bold text-red-600">แพ้ยา:</span>
      <span className="text-xs font-semibold text-text-primary">{profile.drugAllergies.join(', ')}</span>
      <span className="ml-auto text-[11px] text-text-muted">HN {profile.hn}</span>
    </div>
  );
};
