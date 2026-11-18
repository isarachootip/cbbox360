import { clientModuleRegistry } from '../core/client/registry/clientModuleRegistry';
import { creditSalesClientManifest } from './credit-sales/client/manifest';
import { appointmentClientManifest } from './appointment/client/manifest';
import { policyClientManifest } from './policy/client/manifest';
import { claimClientManifest } from './claim/client/manifest';
import { orderTrackingClientManifest } from './order-tracking/client/manifest';

let registered = false;

export const registerBuiltInClientModules = (): void => {
  if (registered) return;
  registered = true;
  clientModuleRegistry.register(creditSalesClientManifest);
  clientModuleRegistry.register(appointmentClientManifest);
  clientModuleRegistry.register(policyClientManifest);
  clientModuleRegistry.register(claimClientManifest);
  clientModuleRegistry.register(orderTrackingClientManifest);
};
