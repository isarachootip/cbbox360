import React from 'react';
import { FileCheck2 } from 'lucide-react';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import type { ClientModuleManifest, ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

const SAMPLE_CLAIMS = [
  {
    claimNumber: 'CLM-2026-0042',
    policyNumber: 'POL-2026-8801',
    incidentDate: '2026-11-10',
    claimAmount: '฿18,500',
    status: 'In Review',
  },
];

const ContactClaimTab: React.FC<ModuleSlotProps> = () => (
  <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
    {SAMPLE_CLAIMS.map((clm) => (
      <div key={clm.claimNumber} className="p-3.5 flex items-center justify-between hover:bg-bg-subtle">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand" />
            <span className="font-mono text-xs font-bold text-brand">{clm.claimNumber}</span>
            <span className="text-xs font-semibold text-text-primary">อ้างอิง {clm.policyNumber}</span>
          </div>
          <div className="text-xs text-text-secondary">
            วันที่เกิดเหตุ <span className="font-mono">{clm.incidentDate}</span> · ยอดเรียกร้อง{' '}
            <span className="font-mono font-semibold text-text-primary">{clm.claimAmount}</span>
          </div>
        </div>
        <StatusBadge status={clm.status} />
      </div>
    ))}
  </div>
);

export const claimClientManifest: ClientModuleManifest = {
  id: 'claim',
  requiredEntitlement: 'module:claim',
  contactTabs: [
    {
      key: 'Claims',
      labelKey: 'tab.claims',
      defaultLabel: 'ประวัติเคลมสินไหม',
      requiredPermission: 'claim:read',
      component: ContactClaimTab,
    },
  ],
};
