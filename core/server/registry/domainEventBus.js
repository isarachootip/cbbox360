/**
 * domainEventBus.js — In-process multi-tenant Domain Event Bus.
 * Decouples Core domains from pluggable Modules without direct cross-module imports.
 */

export const createDomainEventBus = () => {
  /** @type {Map<string, Array<(event: object) => Promise<void>>>} */
  const listeners = new Map();

  const subscribe = (eventName, handler) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, []);
    }
    listeners.get(eventName).push(handler);
  };

  const publish = async (event) => {
    const handlers = listeners.get(event.name) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[DomainEventBus Error] event=${event.name}:`, err.message);
      }
    }
  };

  return { subscribe, publish };
};

export const domainEventBus = createDomainEventBus();
