import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import type { ClientModuleManifest, ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

const SAMPLE_POLICIES = [
  {
    id: 'POL-2026-8801',
    policyType: 'ประกันสุขภาพเหมาจ่าย OPD/IPD',
    sumInsured: '฿1,500,000',
    expiryDate: '2027-06-30',
    agentName: 'คุณวรัญญา ตัวแทนดูแล',
    status: 'Active',
  },
];

const ContactPolicyTab: React.FC<ModuleSlotProps> = () => (
  <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
    {SAMPLE_POLICIES.map((pol) => (
      <div key={pol.id} className="p-3.5 flex items-center justify-between hover:bg-bg-subtle">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span className="font-mono text-xs font-bold text-brand">{pol.id}</span>
            <span className="text-xs font-semibold text-text-primary">{pol.policyType}</span>
          </div>
          <div className="text-xs text-text-secondary">
            ทุนประกัน <span className="font-mono font-semibold text-text-primary">{pol.sumInsured}</span> · หมดอายุ{' '}
            <span className="font-mono">{pol.expiryDate}</span> · {pol.agentName}
          </div>
        </div>
        <StatusBadge status={pol.status} />
      </div>
    ))}
  </div>
);

const PolicyRightCard: React.FC<ModuleSlotProps> = () => (
  <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-2">
    <div className="flex items-center justify-between pb-2 border-b border-divider">
      <span className="text-xs font-bold text-text-primary uppercase tracking-[0.04em]">
        ความคุ้มครองกรมธรรม์
      </span>
      <StatusBadge status="Active" />
    </div>
    <div className="text-xs font-semibold text-text-primary">POL-2026-8801 · สุขภาพ OPD/IPD</div>
    <div className="flex items-center justify-between text-xs text-text-secondary">
      <span>ทุนประกัน ฿1,500,000</span>
      <span className="font-mono">หมดอายุ 2027-06-30</span>
    </div>
  </div>
);

export const policyClientManifest: ClientModuleManifest = {
  id: 'policy',
  requiredEntitlement: 'module:policy',
  slots: {
    'contact.right_rail.cards': PolicyRightCard,
  },
  contactTabs: [
    {
      key: 'Policies',
      labelKey: 'tab.policies',
      defaultLabel: 'กรมธรรม์',
      requiredPermission: 'policy:read',
      component: ContactPolicyTab,
    },
  ],
};
