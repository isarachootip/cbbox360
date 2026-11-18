/**
 * connectors/registry.js — Central registry of pluggable external connectors.
 */
import { hisConnectorManifest } from './his-connector/manifest.js';
import { insuranceCoreConnectorManifest } from './insurance-core/manifest.js';

const connectors = new Map();

export const registerConnector = (manifest) => {
  if (!manifest?.id) throw new Error('INVALID_CONNECTOR_MANIFEST');
  connectors.set(manifest.id, manifest);
  return manifest;
};

export const getConnectorById = (id) => connectors.get(id) ?? null;

export const listEntitledConnectors = async (tenantId, isEnabledFn) => {
  const out = [];
  for (const c of connectors.values()) {
    if (await isEnabledFn(tenantId, c.requiredEntitlement)) {
      out.push(c);
    }
  }
  return out;
};

registerConnector(hisConnectorManifest);
registerConnector(insuranceCoreConnectorManifest);
