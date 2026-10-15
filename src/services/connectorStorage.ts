import { ConnectorConfig } from '../types';
import { initialConnectors } from '../data/connectors';

export const CONNECTORS_STORAGE_KEY = 'cb360_connectors_config';

/** Reads the connector list persisted by ConnectorsPage, falling back to the seeded defaults. */
export const loadStoredConnectors = (): ConnectorConfig[] => {
  try {
    const raw = localStorage.getItem(CONNECTORS_STORAGE_KEY);
    if (!raw) return initialConnectors;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConnectorConfig[]) : initialConnectors;
  } catch (e) {
    console.warn('Failed to read stored connectors, using defaults', e);
    return initialConnectors;
  }
};

export const saveStoredConnectors = (connectors: ConnectorConfig[]): void => {
  localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(connectors));
};
