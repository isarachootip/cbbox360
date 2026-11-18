import type React from 'react';

export type ExtensionSlotName =
  | 'contact.header.banner'
  | 'contact.profile.metrics'
  | 'contact.detail.tabs'
  | 'contact.right_rail.cards'
  | 'inbox.context_card.extra'
  | 'case.drawer.extra';

export interface ModuleSlotProps {
  contactId?: string;
  contact?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
  caseId?: string;
}

export interface ClientModuleTab {
  key: string;
  labelKey: string;
  defaultLabel: string;
  requiredPermission?: string;
  component: React.ComponentType<ModuleSlotProps>;
}

export interface ClientModuleMenu {
  id: string;
  path: string;
  labelKey: string;
  defaultLabel: string;
  icon: string;
  section: 'CDP' | 'ACTIVITY' | 'ADMINISTRATION';
  order: number;
  requiredPermission?: string;
}

export interface ClientModuleRoute {
  path: string;
  requiredPermission?: string;
  component: React.ComponentType;
}

export interface ClientModuleManifest {
  id: string;
  requiredEntitlement: string;
  /** When true, enabled in offline/default single-tenant fallback unless overridden by server bootstrap. */
  enabledByDefaultInFallback?: boolean;
  menus?: ClientModuleMenu[];
  routes?: ClientModuleRoute[];
  contactTabs?: ClientModuleTab[];
  slots?: Partial<Record<Exclude<ExtensionSlotName, 'contact.detail.tabs'>, React.ComponentType<ModuleSlotProps>>>;
}

class ClientModuleRegistryStore {
  private readonly manifests = new Map<string, ClientModuleManifest>();

  register(manifest: ClientModuleManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  getEntitledModules(isEntitled: (key: string) => boolean): ClientModuleManifest[] {
    return Array.from(this.manifests.values()).filter((m) => isEntitled(m.requiredEntitlement));
  }

  getDefaultFallbackEntitlements(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const m of this.manifests.values()) {
      if (m.enabledByDefaultInFallback) out[m.requiredEntitlement] = true;
    }
    return out;
  }

  getSlotComponents(
    slotName: Exclude<ExtensionSlotName, 'contact.detail.tabs'>,
    isEntitled: (key: string) => boolean
  ): { moduleId: string; Component: React.ComponentType<ModuleSlotProps> }[] {
    const out: { moduleId: string; Component: React.ComponentType<ModuleSlotProps> }[] = [];
    for (const mod of this.getEntitledModules(isEntitled)) {
      const Component = mod.slots?.[slotName];
      if (Component) out.push({ moduleId: mod.id, Component });
    }
    return out;
  }

  getContactTabs(
    isEntitled: (key: string) => boolean,
    hasPermission: (code: string) => boolean
  ): (ClientModuleTab & { moduleId: string })[] {
    const tabs: (ClientModuleTab & { moduleId: string })[] = [];
    for (const mod of this.getEntitledModules(isEntitled)) {
      for (const tab of mod.contactTabs || []) {
        if (!tab.requiredPermission || hasPermission(tab.requiredPermission)) {
          tabs.push({ ...tab, moduleId: mod.id });
        }
      }
    }
    return tabs;
  }
}

export const clientModuleRegistry = new ClientModuleRegistryStore();
