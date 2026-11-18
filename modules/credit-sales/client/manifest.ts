import type { ClientModuleManifest } from '../../../core/client/registry/clientModuleRegistry';
import { CreditRightRailCard } from './CreditRightRailCard';
import { ContactOrdersTab } from './ContactOrdersTab';
import { ContactCreditTab } from './ContactCreditTab';

export const creditSalesClientManifest: ClientModuleManifest = {
  id: 'credit-sales',
  requiredEntitlement: 'module:credit-sales',
  enabledByDefaultInFallback: true,
  slots: {
    'contact.right_rail.cards': CreditRightRailCard,
  },
  contactTabs: [
    {
      key: 'Orders',
      labelKey: 'tab.orders',
      defaultLabel: 'Orders',
      component: ContactOrdersTab,
    },
    {
      key: 'Credit',
      labelKey: 'tab.credit',
      defaultLabel: 'Credit',
      component: ContactCreditTab,
    },
  ],
};
