import React from 'react';
import { Package } from 'lucide-react';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import type { ClientModuleManifest, ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

const ContactOrderTrackingTab: React.FC<ModuleSlotProps> = () => (
  <div className="p-4 rounded-xl border border-border bg-bg-subtle flex items-center justify-between">
    <div className="flex items-center gap-2.5 text-xs">
      <Package className="w-4 h-4 text-brand" />
      <span className="font-mono font-bold text-brand">ORD-2026-901</span>
      <span className="text-text-secondary">กำลังจัดส่งพัสดุ · KEX-882910</span>
    </div>
    <StatusBadge status="In Progress" />
  </div>
);

export const orderTrackingClientManifest: ClientModuleManifest = {
  id: 'order-tracking',
  requiredEntitlement: 'module:order-tracking',
  contactTabs: [
    {
      key: 'OrderTracking',
      labelKey: 'tab.order_tracking',
      defaultLabel: 'ติดตามคำสั่งซื้อ',
      requiredPermission: 'order:read',
      component: ContactOrderTrackingTab,
    },
  ],
};
