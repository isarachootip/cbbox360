import React from 'react';
import { Calendar } from 'lucide-react';
import type { ClientModuleManifest, ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';
import { ContactAppointmentTab } from './ContactAppointmentTab';

const AppointmentRightCard: React.FC<ModuleSlotProps> = () => (
  <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-2">
    <div className="flex items-center justify-between pb-2 border-b border-divider">
      <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
        นัดหมายแพทย์ถัดไป
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Confirmed</span>
      </span>
    </div>
    <div className="flex items-center gap-2 text-xs text-text-primary font-semibold pt-1">
      <Calendar className="w-3.5 h-3.5 text-brand" />
      <span>25 พ.ย. 2026 · 09:30 น.</span>
    </div>
    <div className="text-xs text-text-secondary">นพ. กิตติพงศ์ วงศ์เวช · ศูนย์อายุรกรรมหัวใจ</div>
  </div>
);

export const appointmentClientManifest: ClientModuleManifest = {
  id: 'appointment',
  requiredEntitlement: 'module:appointment',
  slots: {
    'contact.right_rail.cards': AppointmentRightCard,
  },
  contactTabs: [
    {
      key: 'Appointments',
      labelKey: 'tab.appointments',
      defaultLabel: 'นัดหมายแพทย์',
      requiredPermission: 'appointment:read',
      component: ContactAppointmentTab,
    },
  ],
};
