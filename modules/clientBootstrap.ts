import { clientModuleRegistry } from '../core/client/registry/clientModuleRegistry';
import { creditSalesClientManifest } from './credit-sales/client/manifest';

let registered = false;

export const registerBuiltInClientModules = (): void => {
  if (registered) return;
  registered = true;
  clientModuleRegistry.register(creditSalesClientManifest);
};
