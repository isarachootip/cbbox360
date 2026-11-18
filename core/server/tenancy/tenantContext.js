/**
 * tenantContext.js — Request-scoped multi-tenant execution context via AsyncLocalStorage.
 * Ensures repositories and services resolve the active tenant without global mutable singletons.
 */
import { AsyncLocalStorage } from 'async_hooks';

export const DEFAULT_TENANT_ID = 'default';

const storage = new AsyncLocalStorage();

/**
 * @typedef {Object} TenantExecutionContext
 * @property {string} tenantId
 * @property {string} [tenantSlug]
 * @property {string} [hostname]
 * @property {'shared_db' | 'dedicated_db'} [isolationMode]
 */

/**
 * Executes `fn` within an isolated tenant execution context.
 * @template T
 * @param {TenantExecutionContext} context
 * @param {() => T} fn
 * @returns {T}
 */
export const runWithTenantContext = (context, fn) => {
  const normalized = {
    tenantId: context?.tenantId || DEFAULT_TENANT_ID,
    tenantSlug: context?.tenantSlug || context?.tenantId || DEFAULT_TENANT_ID,
    hostname: context?.hostname || '',
    isolationMode: context?.isolationMode || 'shared_db',
  };
  return storage.run(normalized, fn);
};

/**
 * Returns the active tenant context, or undefined when outside a request context.
 * @returns {TenantExecutionContext | undefined}
 */
export const getTenantContext = () => storage.getStore();

/**
 * Returns the active tenant ID, safely falling back to 'default' for backward compatibility.
 * @returns {string}
 */
export const getCurrentTenantId = () => storage.getStore()?.tenantId || DEFAULT_TENANT_ID;

/**
 * Throws if no explicit tenant context is bound (for strict multi-tenant endpoints).
 * @returns {string}
 */
export const requireCurrentTenantId = () => {
  const ctx = storage.getStore();
  if (!ctx?.tenantId) {
    throw new Error('TENANT_CONTEXT_MISSING');
  }
  return ctx.tenantId;
};
