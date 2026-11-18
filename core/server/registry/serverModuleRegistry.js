/**
 * serverModuleRegistry.js — Runtime Registry for Pluggable Backend Modules.
 * - Enforces entitlement checks (`requireEntitlement`) on all module routes (`/api/m/<id>/*`).
 * - Enforces entitlement checks before dispatching domain events or variable resolvers to modules.
 * - Runs per-module SQL migrations cleanly via `migrationRunner`.
 */
import { Router } from 'express';
import { runMigrations } from '../db/migrationRunner.js';
import { entitlementService as defaultEntitlements } from '../entitlements/entitlementService.js';
import { labelService as defaultLabels } from '../labels/labelService.js';
import { domainEventBus as defaultEventBus } from './domainEventBus.js';
import { writeAuditLog as defaultAudit } from '../../../server/services/auditService.js';
import { query as defaultDbQuery } from '../../../db.js';

export const createServerModuleRegistry = ({
  entitlements = defaultEntitlements,
  labels = defaultLabels,
  events = defaultEventBus,
  audit = defaultAudit,
  requireAuth = (_req, _res, next) => next(),
  dbQuery = defaultDbQuery,
} = {}) => {
  const modules = new Map();
  let eventsBound = false;

  const moduleContext = {
    getDb: async () => ({ query: dbQuery }),
    entitlements: { isEnabled: entitlements.isEnabled },
    labels: { t: labels.t },
    audit: { log: audit },
    events,
  };

  const register = (manifest) => {
    if (!manifest?.id) throw new Error('INVALID_MODULE_MANIFEST: missing id');
    if (modules.has(manifest.id)) {
      throw new Error(`DUPLICATE_MODULE_ID: ${manifest.id}`);
    }
    modules.set(manifest.id, manifest);
    return manifest;
  };

  const listModules = () => Array.from(modules.values());

  const collectPermissions = () => {
    const out = [];
    for (const mod of modules.values()) {
      for (const perm of mod.permissions || []) {
        out.push({ ...perm, moduleId: mod.id });
      }
    }
    return out;
  };

  const runAllModuleMigrations = async (db = { query: dbQuery }) => {
    const results = [];
    for (const mod of modules.values()) {
      if (!mod.migrationsPath) continue;
      const res = await runMigrations({
        db,
        scope: `module:${mod.id}`,
        migrationsDir: mod.migrationsPath,
      });
      results.push(res);
    }
    return results;
  };

  const buildApiRouter = () => {
    const rootRouter = Router();
    for (const mod of modules.values()) {
      if (typeof mod.registerRoutes !== 'function') continue;
      const modRouter = Router();
      mod.registerRoutes(modRouter, moduleContext);
      rootRouter.use(
        `/m/${mod.id}`,
        requireAuth,
        entitlements.requireEntitlement(mod.requiredEntitlement),
        modRouter
      );
    }
    return rootRouter;
  };

  const bindAllEventHandlers = () => {
    if (eventsBound) return;
    eventsBound = true;
    for (const mod of modules.values()) {
      if (typeof mod.registerEventHandlers !== 'function') continue;
      const scopedBus = {
        publish: events.publish,
        subscribe: (eventName, handler) => {
          events.subscribe(eventName, async (event) => {
            const allowed = await entitlements.isEnabled(event.tenantId, mod.requiredEntitlement);
            if (!allowed) return;
            await handler(event, moduleContext);
          });
        },
      };
      mod.registerEventHandlers(scopedBus, moduleContext);
    }
  };

  const resolveVariables = async ({ tenantId, contactId, caseId }) => {
    const aggregated = {};
    for (const mod of modules.values()) {
      if (typeof mod.resolveTemplateVariables !== 'function') continue;
      const allowed = await entitlements.isEnabled(tenantId, mod.requiredEntitlement);
      if (!allowed) continue;
      const vars = await mod.resolveTemplateVariables({ tenantId, contactId, caseId }, moduleContext);
      Object.assign(aggregated, vars || {});
    }
    return aggregated;
  };

  return {
    register,
    listModules,
    collectPermissions,
    runAllModuleMigrations,
    buildApiRouter,
    bindAllEventHandlers,
    resolveVariables,
  };
};
