/**
 * modules/serverBootstrap.js — Registers backend domain modules & profile policies at server startup.
 */
import { creditSalesServerManifest } from './credit-sales/manifest.js';
import { hospitalProfileAccessPolicy } from './patient-profile/policy.js';
import { registerProfileAccessPolicy } from '../server/services/industryProfileService.js';
import '../connectors/registry.js';

let initialized = false;

export const registerBuiltInServerModules = (serverModuleRegistry) => {
  registerProfileAccessPolicy(hospitalProfileAccessPolicy);
  if (initialized) return;
  initialized = true;
  serverModuleRegistry.register(creditSalesServerManifest);
  serverModuleRegistry.bindAllEventHandlers();
};
