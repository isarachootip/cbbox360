/**
 * modules/serverBootstrap.js — Registers backend domain modules & profile policies at server startup.
 */
import { creditSalesServerManifest } from './credit-sales/manifest.js';
import { appointmentServerManifest } from './appointment/manifest.js';
import { policyServerManifest } from './policy/manifest.js';
import { claimServerManifest } from './claim/manifest.js';
import { orderTrackingServerManifest } from './order-tracking/manifest.js';
import { hospitalProfileAccessPolicy } from './patient-profile/policy.js';
import { registerProfileAccessPolicy } from '../server/services/industryProfileService.js';
import '../connectors/registry.js';

let initialized = false;

export const registerBuiltInServerModules = (serverModuleRegistry) => {
  registerProfileAccessPolicy(hospitalProfileAccessPolicy);
  if (initialized) return;
  initialized = true;
  serverModuleRegistry.register(creditSalesServerManifest);
  serverModuleRegistry.register(appointmentServerManifest);
  serverModuleRegistry.register(policyServerManifest);
  serverModuleRegistry.register(claimServerManifest);
  serverModuleRegistry.register(orderTrackingServerManifest);
  serverModuleRegistry.bindAllEventHandlers();
};
