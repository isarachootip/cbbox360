import { useTenantRuntime } from '../providers/TenantRuntimeContext';

/**
 * Frontend entitlement & feature-flag hook backed by the active tenant's runtime configuration.
 */
export const useEntitlement = () => {
  const { entitlements, isEntitled, hasPermission } = useTenantRuntime();
  return {
    entitlements,
    isEntitled,
    hasPermission,
  };
};
